import type { SupabaseClient } from "@supabase/supabase-js";

/** Historias en las que participa al menos uno de los medios (unión). */
export async function historiaIdsForMedioSlugs(
  supabase: SupabaseClient,
  slugs: string[],
): Promise<string[]> {
  if (slugs.length === 0) return [];
  const { data: medios, error: mErr } = await supabase
    .from("medios")
    .select("id")
    .in("slug", slugs)
    .eq("active", true);
  if (mErr) throw mErr;
  const medioIds = (medios ?? []).map((m) => m.id as string);
  if (medioIds.length === 0) return [];

  const { data: arts, error: aErr } = await supabase
    .from("articulos")
    .select("historia_id")
    .in("medio_id", medioIds);
  if (aErr) throw aErr;

  return [
    ...new Set(
      (arts ?? [])
        .map((a) => a.historia_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}
