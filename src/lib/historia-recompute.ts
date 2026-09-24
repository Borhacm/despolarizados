import type { SupabaseClient } from "@supabase/supabase-js";
import { factualidadRank } from "@/lib/factualidad";
import { sesgoLabelShort } from "@/lib/sesgo";
import { decodeHtmlEntities } from "@/lib/html-entities";
import { lexicalClusteringScore } from "@/lib/title-similarity";
import { cosineSimilarity, parseVector } from "@/lib/vector";

/** Palabras muy frecuentes en catalán y raras en castellano. */
const RE_CATALAN = /\b(els|les|amb|però|aquest|aquesta|són|més|pel|dels|als|l'|d'|n'|s')\b|\b(l|d|s|n)['’]\w/i;

type Candidate = {
  titulo: string;
  resumen: string | null;
  rank: number;
  emb: number[] | null;
  fechaMs: number;
};

/**
 * Titular canónico: el más representativo de la historia (el que más se parece al resto
 * de titulares), en castellano si lo hay; la «factualidad» solo desempata. Con historias
 * de decenas de artículos, elegir por medio dejaba titulares de ángulos secundarios.
 */
function pickCanonical(items: Candidate[]): Candidate | null {
  if (items.length === 0) return null;
  const castellano = items.filter((c) => !RE_CATALAN.test(c.titulo));
  const candidates = castellano.length > 0 ? castellano : items;

  // Con embeddings: el titular más cercano al centro semántico de la historia.
  const withEmb = items.filter((c) => c.emb && c.emb.length > 0);
  if (withEmb.length >= Math.max(2, items.length / 2)) {
    const dim = withEmb[0]!.emb!.length;
    const centroid = new Array<number>(dim).fill(0);
    for (const c of withEmb) for (let k = 0; k < dim; k++) centroid[k]! += c.emb![k]! / withEmb.length;
    const scored = candidates
      .filter((c) => c.emb && c.emb.length === dim)
      .map((c) => ({ c, score: cosineSimilarity(c.emb!, centroid) + c.rank * 0.001 }));
    if (scored.length > 0) {
      const top = Math.max(...scored.map((x) => x.score));
      // Entre los casi igual de centrales, el publicado primero: suele ser el del hecho
      // original y no el de una reacción posterior.
      const near = scored.filter((x) => x.score >= top - 0.01).sort((a, b) => a.c.fechaMs - b.c.fechaMs);
      return near[0]!.c;
    }
  }

  // Sin embeddings: el titular que más palabras comparte con el resto.
  const pool = items.length > 60 ? items.slice(-60) : items;
  let best: Candidate | null = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    let sum = 0;
    for (const o of pool) if (o !== c) sum += lexicalClusteringScore(c.titulo, "", o.titulo, null);
    const score = sum / Math.max(1, pool.length - 1) + c.rank * 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/** Quita coletillas del RSS («Leer», «Leer más», «Seguir leyendo»). */
function cleanSummary(text: string): string {
  return text.replace(/\s*(Leer( más)?|Seguir leyendo)\.?\s*$/i, "").trim();
}

/**
 * Recalcula titular/resumen canónico (mejor factualidad), fechas, contadores e
 * importancia a partir de los artículos enlazados. Usado por ingesta y admin.
 */
export async function recomputeHistoria(
  supabase: SupabaseClient,
  historiaId: string,
): Promise<void> {
  const { data: arts, error } = await supabase
    .from("articulos")
    .select("id, titulo, resumen, fecha_pub, medio_id, embedding")
    .eq("historia_id", historiaId);

  if (error) throw error;
  const rows = arts ?? [];
  const medioIds = [...new Set(rows.map((r) => r.medio_id as string))];
  const dates = rows
    .map((r) => r.fecha_pub)
    .filter(Boolean)
    .sort() as string[];

  const { data: mediosRows, error: mErr } =
    medioIds.length > 0
      ? await supabase
          .from("medios")
          .select("id, factualidad, nombre, sesgo")
          .in("id", medioIds)
      : { data: [], error: null };

  if (mErr) throw mErr;
  const medioMap = new Map(
    (mediosRows ?? []).map((m) => [m.id as string, m] as const),
  );

  const chosen = pickCanonical(
    rows.map((r) => ({
      titulo: r.titulo as string,
      resumen: (r.resumen as string | null) ?? null,
      rank: factualidadRank(medioMap.get(r.medio_id as string)?.factualidad ?? "media"),
      emb: parseVector((r as { embedding?: unknown }).embedding),
      fechaMs: r.fecha_pub ? new Date(r.fecha_pub as string).getTime() : Number.MAX_SAFE_INTEGER,
    })),
  );
  const titulo = chosen ? decodeHtmlEntities(chosen.titulo) : "";
  const resumen = chosen?.resumen ? cleanSummary(decodeHtmlEntities(chosen.resumen)) : null;

  const fallbackNow = new Date().toISOString();
  const primera_pub =
    dates[0] ?? (rows.length > 0 ? fallbackNow : null);
  const ultima_pub =
    dates[dates.length - 1] ?? (rows.length > 0 ? fallbackNow : null);
  const article_count = rows.length;
  const medio_count = new Set(medioIds).size;
  // Importancia por pluralidad: cuentan los medios distintos y los lados del espectro
  // que cubren la historia, no cuántas piezas publica un mismo medio.
  const lados = new Set(
    (mediosRows ?? []).map((m) => sesgoLabelShort((m.sesgo as string) ?? "")),
  ).size;
  const importancia = medio_count * 10 + (medio_count >= 2 ? lados * 8 : 0);

  await supabase
    .from("historias")
    .update({
      titulo_canonico: titulo || "Sin título",
      resumen_canonico: resumen,
      primera_pub,
      ultima_pub,
      article_count,
      medio_count,
      importancia,
      updated_at: new Date().toISOString(),
    })
    .eq("id", historiaId);
}
