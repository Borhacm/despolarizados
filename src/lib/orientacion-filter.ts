import type { SupabaseClient } from "@supabase/supabase-js";
import { sesgoLabelShort } from "@/lib/sesgo";

export type OrientacionFiltro = "" | "izquierda" | "centro" | "derecha";

const SESGO_CORTO: Record<Exclude<OrientacionFiltro, "">, string> = {
  izquierda: "Izquierda",
  centro: "Centro",
  derecha: "Derecha",
};

export function parseOrientacionFiltro(
  raw: string | undefined,
): OrientacionFiltro {
  if (raw === "izquierda" || raw === "centro" || raw === "derecha") {
    return raw;
  }
  return "";
}

/**
 * Historias que tienen al menos un artículo de un medio activo cuya orientación
 * (agrupada izq / centro / der) coincide con el filtro.
 */
export async function fetchHistoriaIdsForOrientacion(
  supabase: SupabaseClient,
  orientacion: Exclude<OrientacionFiltro, "">,
  maxIds: number,
): Promise<string[]> {
  const corto = SESGO_CORTO[orientacion];
  const { data: mediosRows, error } = await supabase
    .from("medios")
    .select("id, sesgo")
    .eq("active", true);

  if (error || !mediosRows?.length) return [];

  const medioIds: string[] = [];
  for (const m of mediosRows) {
    if (sesgoLabelShort(m.sesgo as string) === corto) {
      medioIds.push(m.id as string);
    }
  }
  if (medioIds.length === 0) return [];

  const { data: arts, error: aErr } = await supabase
    .from("articulos")
    .select("historia_id")
    .in("medio_id", medioIds);

  if (aErr || !arts?.length) return [];

  const ids = [
    ...new Set(
      arts
        .map((a) => a.historia_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  return ids.slice(0, maxIds);
}

export function intersectHistoriaIds(a: string[], b: string[]): string[] {
  if (a.length === 0 || b.length === 0) return [];
  const smaller = a.length <= b.length ? a : b;
  const larger = a.length <= b.length ? b : a;
  const set = new Set(larger);
  return smaller.filter((id) => set.has(id));
}
