/**
 * Agrupa historias recientes y fusiona duplicados usando la misma métrica que la
 * ingesta (`lexicalClusteringScore`) + un mínimo de similitud **solo entre
 * titulares** (`DEDUPE_MIN_TITLE_PAIR`, default 0.38). Puede añadirse una vía
 * extra (activa por defecto) si **mismo día** (`ultima_pub`) y **ancla** compartida
 * (nombre/entidad no genérica, p. ej. "guardiola") aun con titulares poco
 * solapados, controlada por `DEDUPE_ANCHOR_*` y `DEDUPE_SAME_DAY_ANCHOR`. La vía
 * ancla no cierra en cadena: solo pares 1+1, para no arrastrar toda un agenda
 * temática bajo un mismo nodo.
 *
 * Uso:
 *   npm run dedupe-historias -- --dry-run
 *   npm run dedupe-historias
 *
 * Opcional en .env.local:
 *   DEDUPE_MAX_HISTORIAS=800
 *   DEDUPE_MIN_TITLE_PAIR=0.38
 *   DEDUPE_SAME_DAY_ANCHOR=1    (0/false = desactiva vía ancla)
 *   DEDUPE_ANCHOR_MIN_LEXICAL=0.3
 *   DEDUPE_ANCHOR_MIN_TITLE=0.2
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({
  path: resolve(process.cwd(), ".env.local"),
  override: true,
  quiet: true,
});

import { mergeHistoriasInto } from "../src/lib/merge-historias";
import { createServiceClient } from "../src/lib/supabase/service";
import {
  hasHistoriasSharedTitleOnlyDedupeAnchor,
  lexicalClusteringScore,
  parseLexicalThreshold,
  samePublicacionDate,
  similarityForClustering,
} from "../src/lib/title-similarity";

type HRow = {
  id: string;
  titulo_canonico: string;
  resumen_canonico: string | null;
  importancia: number;
  article_count: number;
  ultima_pub: string | null;
};

const dryRun = process.argv.includes("--dry-run");

function minTitlePairSimilarity(): number {
  const raw = process.env.DEDUPE_MIN_TITLE_PAIR?.trim();
  if (!raw) return 0.38;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0.2 || n > 0.95) return 0.38;
  return n;
}

function sameDayAnchorEnabled(): boolean {
  const r = process.env.DEDUPE_SAME_DAY_ANCHOR?.trim().toLowerCase();
  if (r === "0" || r === "false" || r === "no") return false;
  return true;
}

function anchorMinLexical(): number {
  const raw = process.env.DEDUPE_ANCHOR_MIN_LEXICAL?.trim();
  if (!raw) return 0.3;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0.12 || n > 0.55) return 0.3;
  return n;
}

function anchorMinTitle(): number {
  const raw = process.env.DEDUPE_ANCHOR_MIN_TITLE?.trim();
  if (!raw) return 0.2;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0.1 || n > 0.45) return 0.2;
  return n;
}

function unionFindWithSize(ids: string[]) {
  const parent = new Map<string, string>();
  const sz = new Map<string, number>();
  for (const id of ids) {
    parent.set(id, id);
    sz.set(id, 1);
  }

  function find(x: string): string {
    let p = parent.get(x)!;
    if (p !== x) {
      p = find(p);
      parent.set(x, p);
    }
    return p;
  }

  /** Fase estricta: cierre transitivo (varias piezas de la misma noticia). */
  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    let x = ra;
    let y = rb;
    if ((sz.get(x) ?? 0) < (sz.get(y) ?? 0)) {
      const t = x;
      x = y;
      y = t;
    }
    parent.set(y, x);
    sz.set(x, (sz.get(x) ?? 0) + (sz.get(y) ?? 0));
  }

  /**
   * Fase ancla: solo 1+1, sin tercer nodo; evita cadenar relajados a lo largo del
   * mismo día. Si hace falta 2→+1, otra vuelta del script tras recompute o ingesta.
   */
  function unionRelaxedSingletonOnly(a: string, b: string): boolean {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    if ((sz.get(ra) ?? 0) !== 1 || (sz.get(rb) ?? 0) !== 1) {
      return false;
    }
    parent.set(ra, rb);
    sz.set(rb, 2);
    sz.delete(ra);
    return true;
  }

  return { find, union, unionRelaxedSingletonOnly };
}

function clusterMembers(
  ids: string[],
  uf: ReturnType<typeof unionFindWithSize>,
): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const id of ids) {
    const r = uf.find(id);
    const arr = m.get(r) ?? [];
    arr.push(id);
    m.set(r, arr);
  }
  return m;
}

function pickWinner(rows: Map<string, HRow>, clusterIds: string[]): string {
  const list = clusterIds.map((id) => rows.get(id)!).filter(Boolean);
  list.sort((a, b) => {
    if (b.importancia !== a.importancia) return b.importancia - a.importancia;
    if (b.article_count !== a.article_count) return b.article_count - a.article_count;
    const ua = a.ultima_pub ?? "";
    const ub = b.ultima_pub ?? "";
    return ub.localeCompare(ua);
  });
  return list[0]!.id;
}

async function main() {
  const supabase = createServiceClient();
  const threshold = parseLexicalThreshold();
  const minTitlePair = minTitlePairSimilarity();
  const anchorEnabled = sameDayAnchorEnabled();
  const anchorLex = anchorMinLexical();
  const anchorTitle = anchorMinTitle();
  const maxH = Math.min(
    5000,
    Math.max(50, Number(process.env.DEDUPE_MAX_HISTORIAS) || 800),
  );

  const { data, error } = await supabase
    .from("historias")
    .select(
      "id, titulo_canonico, resumen_canonico, importancia, article_count, ultima_pub",
    )
    .order("ultima_pub", { ascending: false, nullsFirst: false })
    .limit(maxH);

  if (error) throw error;
  const historias = (data ?? []) as HRow[];
  const byId = new Map(historias.map((h) => [h.id, h] as const));
  const ids = historias.map((h) => h.id);

  const uf = unionFindWithSize(ids);
  const relaxedQueue: { ai: string; bj: string; score: number }[] = [];

  for (let i = 0; i < historias.length; i++) {
    for (let j = i + 1; j < historias.length; j++) {
      const a = historias[i]!;
      const b = historias[j]!;
      const score = lexicalClusteringScore(
        a.titulo_canonico,
        a.resumen_canonico ?? "",
        b.titulo_canonico,
        b.resumen_canonico,
      );
      const titlePair = similarityForClustering(
        a.titulo_canonico,
        b.titulo_canonico,
      );
      const strict = score >= threshold && titlePair >= minTitlePair;
      if (strict) {
        uf.union(a.id, b.id);
        continue;
      }
      if (!anchorEnabled) continue;
      const sameDay = samePublicacionDate(a.ultima_pub, b.ultima_pub);
      const anchor = hasHistoriasSharedTitleOnlyDedupeAnchor(
        a.titulo_canonico,
        b.titulo_canonico,
      );
      const relaxed =
        sameDay &&
        anchor &&
        score >= anchorLex &&
        titlePair >= anchorTitle;
      if (relaxed) {
        relaxedQueue.push({ ai: a.id, bj: b.id, score });
      }
    }
  }

  if (relaxedQueue.length) {
    relaxedQueue.sort((x, y) => y.score - x.score);
    for (const { ai, bj } of relaxedQueue) {
      uf.unionRelaxedSingletonOnly(ai, bj);
    }
  }

  const clusters = clusterMembers(ids, uf);
  const toMerge: { winner: string; sources: string[]; preview: string[] }[] =
    [];

  for (const [, members] of clusters) {
    if (members.length < 2) continue;
    const winner = pickWinner(byId, members);
    const sources = members.filter((id) => id !== winner).sort();
    toMerge.push({
      winner,
      sources,
      preview: members.map((id) => {
        const h = byId.get(id)!;
        return `${id.slice(0, 8)}… ${h.titulo_canonico.slice(0, 72)}…`;
      }),
    });
  }

  if (toMerge.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          thresholdLexical: threshold,
          minTitlePairSimilarity: minTitlePair,
          sameDayAnchor: anchorEnabled
            ? { minLex: anchorLex, minTitle: anchorTitle }
            : { disabled: true },
          historiasComparadas: historias.length,
          gruposDuplicados: 0,
          fusiones: 0,
          dryRun,
        },
        null,
        2,
      ),
    );
    return;
  }

  let merges = 0;
  const details: unknown[] = [];

  for (const g of toMerge) {
    for (const sourceId of g.sources) {
      if (dryRun) {
        details.push({
          action: "would_merge",
          target: g.winner,
          source: sourceId,
        });
        merges += 1;
        continue;
      }
      try {
        const r = await mergeHistoriasInto(supabase, g.winner, sourceId);
        details.push({ action: "merged", ...r });
        merges += 1;
        byId.delete(sourceId);
      } catch (e) {
        details.push({
          action: "error",
          target: g.winner,
          source: sourceId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        thresholdLexical: threshold,
        minTitlePairSimilarity: minTitlePair,
        sameDayAnchor: anchorEnabled
          ? { minLex: anchorLex, minTitle: anchorTitle }
          : { disabled: true },
        historiasComparadas: historias.length,
        gruposDuplicados: toMerge.length,
        fusiones: merges,
        dryRun,
        grupos: toMerge.map((g) => ({
          conservar: g.winner,
          eliminar: g.sources,
          titulares: g.preview,
        })),
        detalle: details,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
