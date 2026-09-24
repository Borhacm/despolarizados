import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoverageMix } from "@/lib/coverage-mix";
import { fetchCoverageMixByHistoriaIds } from "@/lib/coverage-mix";
import type { HistoriaRow } from "@/lib/types";

/** Un lado «apenas cubre» la historia si no pasa de este % de los medios. */
const MISSING_MAX_PCT = 10;
/** Y el lado contrario sí la cubre al menos con este %. */
const COVERING_MIN_PCT = 25;
const MIN_MEDIOS = 4;
const WINDOW_DAYS = 7;

export type BlindspotRow = HistoriaRow & {
  coverageMix: CoverageMix;
  /** Lado del espectro que apenas ha cubierto la historia. */
  missingSide: "izquierda" | "derecha";
  missingPct: number;
};

/**
 * Historias que un lado del espectro cubre y el otro apenas (estilo «Blindspot» de
 * Ground News). El centro dominante no cuenta: lo relevante es la ausencia de un lado.
 */
export async function fetchBlindspotHistorias(
  supabase: SupabaseClient,
  opts: { limit: number; pool?: number },
): Promise<BlindspotRow[]> {
  const pool = opts.pool ?? 200;
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();
  const { data, error } = await supabase
    .from("historias")
    .select("*")
    .gte("medio_count", MIN_MEDIOS)
    .gte("ultima_pub", since)
    .order("importancia", { ascending: false })
    .limit(pool);

  if (error) throw error;
  const rows = (data ?? []) as HistoriaRow[];
  if (rows.length === 0) return [];

  const mixes = await fetchCoverageMixByHistoriaIds(
    supabase,
    rows.map((r) => r.id),
  );

  const out: BlindspotRow[] = [];
  for (const h of rows) {
    const m = mixes.get(h.id);
    if (!m) continue;
    let missingSide: BlindspotRow["missingSide"] | null = null;
    if (m.izqPct <= MISSING_MAX_PCT && m.derPct >= COVERING_MIN_PCT) missingSide = "izquierda";
    else if (m.derPct <= MISSING_MAX_PCT && m.izqPct >= COVERING_MIN_PCT) missingSide = "derecha";
    if (!missingSide) continue;
    const missingPct = missingSide === "izquierda" ? m.izqPct : m.derPct;
    out.push({ ...h, coverageMix: m, missingSide, missingPct });
    if (out.length >= opts.limit) break;
  }

  return out;
}
