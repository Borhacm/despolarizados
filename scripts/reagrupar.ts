import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), override: true, quiet: true });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { recomputeHistoria } from "../src/lib/historia-recompute";
import { regroupItems, type RegroupGroup, type RegroupItem } from "../src/lib/regroup";
import { createServiceClient } from "../src/lib/supabase/service";
import { parseVector } from "../src/lib/vector";
import { disposeLocalEmbeddings, embedTextsLocal } from "./local-embeddings";

/**
 * Reagrupa los artículos de los últimos N días con embeddings locales.
 *
 *   npm run reagrupar -- 3              ensayo: no escribe nada, muestra el resultado
 *   npm run reagrupar -- 3 --apply      aplica los cambios en la base de datos
 *   npm run reagrupar -- 3 --show=Maricarmen   además lista los grupos que lo mencionan
 *
 * Cada grupo conserva el id de la historia que ya tenía más artículos suyos, para que
 * las URL compartidas sigan funcionando.
 */

type ArtRow = {
  id: string;
  historia_id: string | null;
  medio_id: string;
  titulo: string;
  resumen: string | null;
  fecha_pub: string | null;
  created_at: string;
  embedding: unknown;
};

const args = process.argv.slice(2);
const days = Number.parseInt(args.find((a) => /^\d+$/.test(a)) ?? "3", 10);
const apply = args.includes("--apply");
const show = args.find((a) => a.startsWith("--show="))?.slice(7);
const full = args.includes("--full");

async function loadArticles(sb: SupabaseClient): Promise<ArtRow[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const out: ArtRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("articulos")
      .select("id, historia_id, medio_id, titulo, resumen, fecha_pub, created_at, embedding")
      .gte("fecha_pub", since)
      .order("fecha_pub")
      .range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as ArtRow[]));
    if (!data || data.length < 1000) return out;
  }
}

/** Elige para cada grupo la historia existente con más artículos suyos, sin repetir. */
function assignTargets(groups: RegroupGroup[]): (string | null)[] {
  const taken = new Set<string>();
  const order = groups.map((g, i) => i).sort((a, b) => groups[b]!.items.length - groups[a]!.items.length);
  const targets: (string | null)[] = new Array(groups.length).fill(null);
  for (const i of order) {
    const counts = new Map<string, number>();
    for (const it of groups[i]!.items) {
      if (it.historiaId) counts.set(it.historiaId, (counts.get(it.historiaId) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const pick = ranked.find(([id]) => !taken.has(id))?.[0] ?? null;
    if (pick) taken.add(pick);
    targets[i] = pick;
  }
  return targets;
}

function summarize(groups: RegroupGroup[], targets: (string | null)[]) {
  const medios = (g: RegroupGroup) => new Set(g.items.map((i) => i.medioId)).size;
  const moved = groups.reduce(
    (n, g, i) => n + g.items.filter((it) => it.historiaId !== targets[i]).length,
    0,
  );
  const sizes = groups.map(medios);
  console.log(
    JSON.stringify(
      {
        dias: days,
        historias: groups.length,
        con3medios: sizes.filter((s) => s >= 3).length,
        con5medios: sizes.filter((s) => s >= 5).length,
        mayorArticulos: Math.max(...groups.map((g) => g.items.length)),
        articulosQueCambian: moved,
        historiasNuevas: targets.filter((t) => t === null).length,
      },
      null,
      2,
    ),
  );
  const describe = (g: RegroupGroup) =>
    `\n## ${g.items.length} artículos / ${medios(g)} medios\n` +
    g.items
      .slice(0, full ? undefined : 12)
      .map((it) => `  - ${it.titulo.slice(0, 100)}`)
      .join("\n") +
    (!full && g.items.length > 12 ? `\n  … y ${g.items.length - 12} más` : "");
  const biggest = [...groups].sort((a, b) => b.items.length - a.items.length).slice(0, 10);
  console.log("\nGRUPOS MAYORES" + biggest.map(describe).join(""));
  if (show) {
    const re = new RegExp(show, "i");
    const hits = groups.filter((g) => g.items.some((it) => re.test(it.titulo)));
    console.log(`\nGRUPOS CON «${show}»: ${hits.length}` + hits.map(describe).join(""));
  }
}

async function applyChanges(
  sb: SupabaseClient,
  groups: RegroupGroup[],
  targets: (string | null)[],
  newlyEmbedded: RegroupItem[],
) {
  for (const it of newlyEmbedded) {
    const { error } = await sb.from("articulos").update({ embedding: it.emb }).eq("id", it.id);
    if (error) throw error;
  }
  const touchedOld = new Set<string>();
  const finalIds: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]!;
    let target = targets[i];
    const seedItem = g.items.find((it) => it.emb === g.seed) ?? g.items[0]!;
    if (!target) {
      const { data, error } = await sb
        .from("historias")
        .insert({
          titulo_canonico: seedItem.titulo,
          embedding: g.centroid,
          seed_embedding: g.seed,
          importancia: 0,
          article_count: 0,
          medio_count: 0,
        })
        .select("id")
        .single();
      if (error) throw error;
      target = data!.id as string;
    } else {
      const { error } = await sb
        .from("historias")
        .update({ embedding: g.centroid, seed_embedding: g.seed })
        .eq("id", target);
      if (error) throw error;
    }
    const moving = g.items.filter((it) => it.historiaId !== target);
    for (const it of moving) if (it.historiaId) touchedOld.add(it.historiaId);
    for (let k = 0; k < moving.length; k += 200) {
      const ids = moving.slice(k, k + 200).map((it) => it.id);
      const { error } = await sb.from("articulos").update({ historia_id: target }).in("id", ids);
      if (error) throw error;
    }
    finalIds.push(target);
  }
  let removed = 0;
  for (const hid of touchedOld) {
    const { count, error } = await sb
      .from("articulos")
      .select("id", { count: "exact", head: true })
      .eq("historia_id", hid);
    if (error) throw error;
    if (!count) {
      const { error: delErr } = await sb.from("historias").delete().eq("id", hid);
      if (delErr) throw delErr;
      removed += 1;
    }
  }
  for (const hid of finalIds) await recomputeHistoria(sb, hid);
  console.log(`\nAplicado: ${finalIds.length} historias recalculadas, ${removed} historias vacías eliminadas.`);
}

async function main() {
  const sb = apply
    ? createServiceClient()
    : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const rows = await loadArticles(sb);
  const items: RegroupItem[] = rows.map((r) => ({
    id: r.id,
    historiaId: r.historia_id,
    medioId: r.medio_id,
    titulo: r.titulo,
    fechaMs: new Date(r.fecha_pub ?? r.created_at).getTime(),
    emb: parseVector(r.embedding) ?? [],
  }));
  const missing = items.filter((it) => it.emb.length === 0);
  if (missing.length > 0) {
    const byId = new Map(rows.map((r) => [r.id, r]));
    const embs = await embedTextsLocal(
      missing.map((it) => `${it.titulo}\n${(byId.get(it.id)?.resumen ?? "").slice(0, 300)}`),
    );
    missing.forEach((it, i) => (it.emb = embs[i] ?? []));
  }
  console.log(`${items.length} artículos de los últimos ${days} días (${missing.length} sin embedding previo).`);

  const groups = regroupItems(items);
  const targets = assignTargets(groups);
  summarize(groups, targets);

  if (apply) await applyChanges(sb, groups, targets, missing);
  else console.log("\nEnsayo: no se ha escrito nada. Añade --apply para aplicar.");
}

main()
  .then(async () => {
    await disposeLocalEmbeddings();
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
