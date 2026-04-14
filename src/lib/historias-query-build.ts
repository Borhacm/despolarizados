import type { SupabaseClient } from "@supabase/supabase-js";
import { ventanaToSince } from "@/lib/search-sanitize";

export type HistoriaListFilters = {
  /** Si se pasa array vacío, el caller debe haber devuelto antes sin consultar. */
  idsIn?: string[] | null;
  ventana: string;
  searchTerm: string;
  searchMode: "fts" | "ilike";
};

/**
 * Cadena base para listar historias (home / feed).
 */
export function buildHistoriasSelect(
  supabase: SupabaseClient,
  filters: HistoriaListFilters,
) {
  let q = supabase.from("historias").select("*");

  if (filters.idsIn && filters.idsIn.length > 0) {
    q = q.in("id", filters.idsIn);
  }

  const since = ventanaToSince(filters.ventana);
  if (since) {
    q = q.gte("ultima_pub", since.toISOString());
  }

  if (filters.searchTerm.length > 0) {
    if (filters.searchMode === "fts") {
      q = q.textSearch("search_vector", filters.searchTerm, {
        type: "websearch",
        config: "spanish",
      });
    } else {
      const pattern = `%${filters.searchTerm}%`;
      q = q.or(
        `titulo_canonico.ilike.${pattern},resumen_canonico.ilike.${pattern}`,
      );
    }
  }

  return q;
}
