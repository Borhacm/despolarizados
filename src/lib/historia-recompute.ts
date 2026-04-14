import type { SupabaseClient } from "@supabase/supabase-js";
import { factualidadRank } from "@/lib/factualidad";

/**
 * Recalcula titular/resumen canónico (mejor factualidad), fechas, contadores e
 * importancia a partir de los artículos enlazados. Usado por ingesta y admin.
 */
export async function recomputeHistoria(
  supabase: SupabaseClient,
  historiaId: string,
): Promise<void> {
  const { data: arts, error } = await supabase
    .from("articulos")
    .select("id, titulo, resumen, fecha_pub, medio_id")
    .eq("historia_id", historiaId);

  if (error) throw error;
  const rows = arts ?? [];
  const medioIds = [...new Set(rows.map((r) => r.medio_id as string))];
  const dates = rows
    .map((r) => r.fecha_pub)
    .filter(Boolean)
    .sort() as string[];

  const { data: mediosRows, error: mErr } =
    medioIds.length > 0
      ? await supabase
          .from("medios")
          .select("id, factualidad, nombre")
          .in("id", medioIds)
      : { data: [], error: null };

  if (mErr) throw mErr;
  const medioMap = new Map(
    (mediosRows ?? []).map((m) => [m.id as string, m] as const),
  );

  let titulo = "";
  let resumen: string | null = null;
  let bestRank = -1;

  for (const r of rows) {
    const m = medioMap.get(r.medio_id as string);
    const f = m?.factualidad ?? "media";
    const rank = factualidadRank(f);
    if (rank > bestRank) {
      bestRank = rank;
      titulo = r.titulo as string;
      resumen = (r.resumen as string) ?? null;
    }
  }

  const fallbackNow = new Date().toISOString();
  const primera_pub =
    dates[0] ?? (rows.length > 0 ? fallbackNow : null);
  const ultima_pub =
    dates[dates.length - 1] ?? (rows.length > 0 ? fallbackNow : null);
  const article_count = rows.length;
  const medio_count = new Set(medioIds).size;
  const importancia = article_count * 10 + medio_count * 12;

  await supabase
    .from("historias")
    .update({
      titulo_canonico: titulo || "Sin título",
      resumen_canonico: resumen,
      primera_pub,
      ultima_pub,
      article_count,
      medio_count,
      importancia,
      updated_at: new Date().toISOString(),
    })
    .eq("id", historiaId);
}
