import type { SupabaseClient } from "@supabase/supabase-js";

export type CatalogStats = {
  medios: number;
  /** Historias de las últimas 24 h cubiertas por 2 medios o más. */
  historiasHoy: number;
  /** Artículos publicados en las últimas 24 h. */
  articulosHoy: number;
  /** Total aproximado (estadísticas de Postgres): solo para saber si el catálogo está vacío. */
  historiasTotal: number;
};

const DAY_MS = 24 * 3600 * 1000;

/**
 * Cifras del día en lugar de totales históricos: dicen más al lector y son consultas
 * rápidas (filtran por columnas indexadas). El recuento exacto de toda la tabla
 * `historias` superaba el límite de 3 s de las consultas públicas y devolvía 0.
 */
export async function fetchCatalogStats(
  supabase: SupabaseClient,
): Promise<CatalogStats> {
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const [m, h, a, total] = await Promise.all([
    supabase
      .from("medios")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("historias")
      .select("id", { count: "exact", head: true })
      .gte("ultima_pub", since)
      .gte("medio_count", 2),
    supabase
      .from("articulos")
      .select("id", { count: "exact", head: true })
      .gte("fecha_pub", since),
    supabase.from("historias").select("id", { count: "estimated", head: true }),
  ]);

  return {
    medios: m.count ?? 0,
    historiasHoy: h.count ?? 0,
    articulosHoy: a.count ?? 0,
    historiasTotal: total.count ?? 0,
  };
}
