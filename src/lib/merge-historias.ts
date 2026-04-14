import type { SupabaseClient } from "@supabase/supabase-js";
import { recomputeHistoria } from "@/lib/historia-recompute";

export type MergeHistoriasResult = {
  articlesMoved: number;
  targetId: string;
  removedHistoriaId: string;
};

/**
 * Mueve todos los artículos de `sourceId` a `targetId`, recalcula la historia
 * destino y elimina la fila `source` (vacía). La historia que conservas en URL
 * debe ser `targetId`.
 */
export async function mergeHistoriasInto(
  supabase: SupabaseClient,
  targetId: string,
  sourceId: string,
): Promise<MergeHistoriasResult> {
  const a = targetId.trim();
  const b = sourceId.trim();
  if (!a || !b) {
    throw new Error("Indica ambos UUID de historia.");
  }
  if (a === b) {
    throw new Error("Origen y destino no pueden ser la misma historia.");
  }

  const { data: t, error: tErr } = await supabase
    .from("historias")
    .select("id")
    .eq("id", a)
    .maybeSingle();
  if (tErr) throw tErr;
  if (!t) throw new Error(`No existe historia destino (${a}).`);

  const { data: s, error: sErr } = await supabase
    .from("historias")
    .select("id")
    .eq("id", b)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!s) throw new Error(`No existe historia origen (${b}).`);

  const { data: srcArts, error: cErr } = await supabase
    .from("articulos")
    .select("id")
    .eq("historia_id", b);
  if (cErr) throw cErr;
  const articlesMoved = srcArts?.length ?? 0;

  const { error: upErr } = await supabase
    .from("articulos")
    .update({ historia_id: a })
    .eq("historia_id", b);
  if (upErr) throw upErr;

  await recomputeHistoria(supabase, a);

  const { error: delErr } = await supabase.from("historias").delete().eq("id", b);
  if (delErr) throw delErr;

  return {
    articlesMoved,
    targetId: a,
    removedHistoriaId: b,
  };
}
