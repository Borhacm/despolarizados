import type { SupabaseClient } from "@supabase/supabase-js";

/** Una URL de imagen por historia (artículo más reciente que tenga `imagen_url`). */
export async function fetchCoverImagesByHistoriaIds(
  supabase: SupabaseClient,
  historiaIds: string[],
): Promise<Map<string, string>> {
  if (historiaIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("articulos")
    .select("historia_id, imagen_url, fecha_pub")
    .in("historia_id", historiaIds)
    .not("imagen_url", "is", null);

  if (error || !data?.length) return new Map();

  const sorted = [...data].sort((a, b) => {
    const ta = a.fecha_pub ? new Date(a.fecha_pub as string).getTime() : 0;
    const tb = b.fecha_pub ? new Date(b.fecha_pub as string).getTime() : 0;
    return tb - ta;
  });

  const map = new Map<string, string>();
  for (const row of sorted) {
    const hid = row.historia_id as string | null;
    const url = row.imagen_url as string | null;
    if (hid && url && !map.has(hid)) map.set(hid, url);
  }
  return map;
}
