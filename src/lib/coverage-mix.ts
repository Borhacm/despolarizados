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

/** Reparte 100 puntos entre tres conteos enteros (método del mayor resto). */
function countsToPercentages(
  izq: number,
  centro: number,
  der: number,
): Pick<CoverageMix, "izqPct" | "centroPct" | "derPct"> {
  const t = izq + centro + der;
  const raw = [(izq / t) * 100, (centro / t) * 100, (der / t) * 100];
  const floors = raw.map((x) => Math.floor(x));
  let rem = 100 - floors[0] - floors[1] - floors[2];
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

/** Una etiqueta por medio (deduplicado por `sesgo`). */
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
 * Cobertura por sesgo (izq/centro/der) por historia, contando cada medio una vez.
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

  const byHistoria = new Map<string, Set<string>>();
  const allMedioIds = new Set<string>();
  for (const row of arts) {
    const hid = row.historia_id as string | null;
    const mid = row.medio_id as string | null;
    if (!hid || !mid) continue;
    let set = byHistoria.get(hid);
    if (!set) {
      set = new Set();
      byHistoria.set(hid, set);
    }
    if (!set.has(mid)) {
      set.add(mid);
      allMedioIds.add(mid);
    }
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
    if (!mids?.size) continue;
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
