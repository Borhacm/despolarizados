import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoverageMix } from "@/lib/coverage-mix";
import { fetchCoverageMixByHistoriaIds } from "@/lib/coverage-mix";
import type { HistoriaRow } from "@/lib/types";

const DOMINANT_MIN = 68;

export type BlindspotRow = HistoriaRow & {
  coverageMix: CoverageMix;
  /** Dónde está la mayor parte de la cobertura. */
  skewLabel: "izquierda" | "centro" | "derecha";
};

/**
 * Historias donde una orientación acapara la cobertura (estilo “Blindspot” de Ground News).
 */
export async function fetchBlindspotHistorias(
  supabase: SupabaseClient,
  opts: { limit: number; pool?: number },
): Promise<BlindspotRow[]> {
  const pool = opts.pool ?? 120;
  const { data, error } = await supabase
    .from("historias")
    .select("*")
    .gte("medio_count", 2)
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
    const maxPct = Math.max(m.izqPct, m.centroPct, m.derPct);
    if (maxPct < DOMINANT_MIN) continue;
    let skewLabel: BlindspotRow["skewLabel"] = "centro";
    if (m.izqPct === maxPct) skewLabel = "izquierda";
    else if (m.derPct === maxPct) skewLabel = "derecha";
    out.push({ ...h, coverageMix: m, skewLabel });
    if (out.length >= opts.limit) break;
  }

  return out;
}
