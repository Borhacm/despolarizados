import type { SupabaseClient } from "@supabase/supabase-js";

export type CatalogStats = {
  medios: number;
  historias: number;
  articulos: number;
};

export async function fetchCatalogStats(
  supabase: SupabaseClient,
): Promise<CatalogStats> {
  const [m, h, a] = await Promise.all([
    supabase
      .from("medios")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase.from("historias").select("*", { count: "exact", head: true }),
    supabase.from("articulos").select("*", { count: "exact", head: true }),
  ]);

  return {
    medios: m.count ?? 0,
    historias: h.count ?? 0,
    articulos: a.count ?? 0,
  };
}
