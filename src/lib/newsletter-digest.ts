import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCoverageMixByHistoriaIds, type CoverageMix } from "@/lib/coverage-mix";
import { fetchCoverImagesByHistoriaIds } from "@/lib/historia-covers";
import { buildHistoriaUrl } from "@/lib/newsletter-resend";

const MAX_STORIES = 25;

export type DigestItem = {
  id: string;
  titulo: string;
  resumen: string | null;
  url: string;
  imageUrl: string | null;
  coverageMix: CoverageMix | null;
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

  const rows = (data ?? []) as {
    id: string;
    titulo_canonico: string;
    resumen_canonico: string | null;
  }[];

  const coverageByHistoria = await fetchCoverageMixByHistoriaIds(
    supabase,
    rows.map((row) => row.id),
  );
  const imageByHistoria = await fetchCoverImagesByHistoriaIds(
    supabase,
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: row.id as string,
    titulo: row.titulo_canonico as string,
    resumen: (row.resumen_canonico as string | null) ?? null,
    url: buildHistoriaUrl(row.id as string),
    imageUrl: imageByHistoria.get(row.id) ?? null,
    coverageMix: coverageByHistoria.get(row.id) ?? null,
  }));
}

/** Inicio de ventana: desde la verificación (primer envío) o desde el último digest. */
export function digestWindowStartIso(params: {
  lastDigestSentAt: string | null;
  verifiedAt: string;
}): string {
  return params.lastDigestSentAt ?? params.verifiedAt;
}
