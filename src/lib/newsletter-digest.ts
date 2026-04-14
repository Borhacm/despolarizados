import type { SupabaseClient } from "@supabase/supabase-js";
import { buildHistoriaUrl } from "@/lib/newsletter-resend";

const MAX_STORIES = 25;

export type DigestItem = {
  id: string;
  titulo: string;
  resumen: string | null;
  url: string;
};

/** Historias cuyo registro se creó en el sistema después de `sinceIso` (ingesta/carga). */
export async function fetchHistoriasCargadasDesde(
  supabase: SupabaseClient,
  sinceIso: string,
): Promise<DigestItem[]> {
  const { data, error } = await supabase
    .from("historias")
    .select("id, titulo_canonico, resumen_canonico, created_at")
    .gt("created_at", sinceIso)
    .order("importancia", { ascending: false })
    .limit(MAX_STORIES);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    titulo: row.titulo_canonico as string,
    resumen: (row.resumen_canonico as string | null) ?? null,
    url: buildHistoriaUrl(row.id as string),
  }));
}

/** Inicio de ventana: desde la verificación (primer envío) o desde el último digest. */
export function digestWindowStartIso(params: {
  lastDigestSentAt: string | null;
  verifiedAt: string;
}): string {
  return params.lastDigestSentAt ?? params.verifiedAt;
}
