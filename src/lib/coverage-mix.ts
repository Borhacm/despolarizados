import type { SupabaseClient } from "@supabase/supabase-js";
import { sesgoLabelShort } from "@/lib/sesgo";

export type CoverageMix = {
  izq: number;
  centro: number;
  der: number;
  izqPct: number;
  centroPct: number;
  derPct: number;
};

export type VisualSegment = { left: number; width: number };

/**
 * Barra apilada izq → centro → der: cada tramo coincide con los % sobre el total de noticias.
 */
export function visualCoverageStacked(mix: CoverageMix): {
  left: VisualSegment | null;
  center: VisualSegment | null;
  right: VisualSegment | null;
} {
  const { izqPct, centroPct, derPct } = mix;
  const leftSeg: VisualSegment | null =
    izqPct > 0 ? { left: 0, width: izqPct } : null;
  const centerSeg: VisualSegment | null =
    centroPct > 0 ? { left: izqPct, width: centroPct } : null;
  const rightSeg: VisualSegment | null =
    derPct > 0 ? { left: izqPct + centroPct, width: derPct } : null;
  return { left: leftSeg, center: centerSeg, right: rightSeg };
}

/** Reparte 100 puntos entre tres conteos enteros (método del mayor resto). */
function countsToPercentages(
  izq: number,
  centro: number,
  der: number,
): Pick<CoverageMix, "izqPct" | "centroPct" | "derPct"> {
  const t = izq + centro + der;
  const raw = [(izq / t) * 100, (centro / t) * 100, (der / t) * 100];
  const floors = raw.map((x) => Math.floor(x));
  const rem = 100 - floors[0] - floors[1] - floors[2];
  const order = [0, 1, 2].sort(
    (a, b) =>
      raw[b] - Math.floor(raw[b]) - (raw[a] - Math.floor(raw[a])),
  );
  for (let k = 0; k < rem; k++) {
    floors[order[k]] += 1;
  }
  return {
    izqPct: floors[0],
    centroPct: floors[1],
    derPct: floors[2],
  };
}

/** Cuenta una entrada por noticia: `sesgos` puede repetir el mismo medio varias veces. */
export function coverageMixFromSesgos(sesgos: string[]): CoverageMix | null {
  let izq = 0;
  let centro = 0;
  let der = 0;
  for (const s of sesgos) {
    const l = sesgoLabelShort(s);
    if (l === "Izquierda") izq += 1;
    else if (l === "Derecha") der += 1;
    else centro += 1;
  }
  const t = izq + centro + der;
  if (t === 0) return null;
  const pct = countsToPercentages(izq, centro, der);
  return { izq, centro, der, ...pct };
}

/**
 * Cobertura por sesgo (izq/centro/der) por historia: 100% = total de noticias
 * con medio clasificable; cada noticia cuenta según el sesgo de su medio.
 */
export async function fetchCoverageMixByHistoriaIds(
  supabase: SupabaseClient,
  historiaIds: string[],
): Promise<Map<string, CoverageMix>> {
  const out = new Map<string, CoverageMix>();
  if (historiaIds.length === 0) return out;

  const { data: arts, error } = await supabase
    .from("articulos")
    .select("historia_id, medio_id")
    .in("historia_id", historiaIds);

  if (error || !arts?.length) return out;

  const byHistoria = new Map<string, string[]>();
  const allMedioIds = new Set<string>();
  for (const row of arts) {
    const hid = row.historia_id as string | null;
    const mid = row.medio_id as string | null;
    if (!hid || !mid) continue;
    let list = byHistoria.get(hid);
    if (!list) {
      list = [];
      byHistoria.set(hid, list);
    }
    list.push(mid);
    allMedioIds.add(mid);
  }

  if (allMedioIds.size === 0) return out;

  const { data: mediosRows, error: mErr } = await supabase
    .from("medios")
    .select("id, sesgo")
    .in("id", [...allMedioIds]);

  if (mErr || !mediosRows?.length) return out;

  const sesgoByMedio = new Map(
    (mediosRows ?? []).map((m) => [m.id as string, m.sesgo as string]),
  );

  for (const hid of historiaIds) {
    const mids = byHistoria.get(hid);
    if (!mids?.length) continue;
    const sesgos: string[] = [];
    for (const mid of mids) {
      const s = sesgoByMedio.get(mid);
      if (s) sesgos.push(s);
    }
    const mix = coverageMixFromSesgos(sesgos);
    if (mix) out.set(hid, mix);
  }

  return out;
}
