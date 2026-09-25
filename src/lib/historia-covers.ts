import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Una imagen por historia: la del artículo cuyo titular es el canónico (el más
 * representativo de la historia) y, si no tiene, la del más reciente con imagen. Con la
 * más reciente a secas, las historias grandes acababan con la cabecera de una columna de
 * opinión en lugar de una foto del hecho.
 */
export async function fetchCoverImagesByHistoriaIds(
  supabase: SupabaseClient,
  historiaIds: string[],
): Promise<Map<string, string>> {
  if (historiaIds.length === 0) return new Map();

  const [{ data, error }, { data: hist }] = await Promise.all([
    supabase
      .from("articulos")
      .select("historia_id, titulo, imagen_url, fecha_pub")
      .in("historia_id", historiaIds)
      .not("imagen_url", "is", null),
    supabase.from("historias").select("id, titulo_canonico").in("id", historiaIds),
  ]);

  if (error || !data?.length) return new Map();

  const canonical = new Map((hist ?? []).map((h) => [h.id as string, h.titulo_canonico as string]));
  const sorted = [...data].sort((a, b) => {
    const ta = a.fecha_pub ? new Date(a.fecha_pub as string).getTime() : 0;
    const tb = b.fecha_pub ? new Date(b.fecha_pub as string).getTime() : 0;
    return tb - ta;
  });

  const map = new Map<string, string>();
  for (const row of sorted) {
    const hid = row.historia_id as string | null;
    const url = row.imagen_url as string | null;
    if (hid && url && row.titulo === canonical.get(hid)) map.set(hid, url);
  }
  for (const row of sorted) {
    const hid = row.historia_id as string | null;
    const url = row.imagen_url as string | null;
    if (hid && url && !map.has(hid)) map.set(hid, url);
  }
  return map;
}
