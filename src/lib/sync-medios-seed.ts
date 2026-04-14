import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIOS_SEED } from "@/data/medios-seed";

/**
 * Inserta o actualiza filas por `slug` (equivalente al SQL `on conflict (slug) do update`).
 */
export async function syncMediosSeed(
  supabase: SupabaseClient,
): Promise<{ count: number; error: string | null }> {
  const { error } = await supabase.from("medios").upsert(
    MEDIOS_SEED.map((r) => ({
      nombre: r.nombre,
      slug: r.slug,
      rss_urls: r.rss_urls,
      sesgo: r.sesgo,
      factualidad: r.factualidad,
      ownership: r.ownership,
      prioridad: r.prioridad,
      active: r.active,
    })),
    { onConflict: "slug" },
  );

  if (error) {
    return { count: 0, error: error.message };
  }
  return { count: MEDIOS_SEED.length, error: null };
}
