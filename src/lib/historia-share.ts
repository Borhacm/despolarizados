import type { SupabaseClient } from "@supabase/supabase-js";
import {
  coverageMixFromSesgos,
  type CoverageMix,
} from "@/lib/coverage-mix";

export type HistoriaShareFields = {
  titulo_canonico: string;
  resumen_canonico: string | null;
  medio_count: number;
  article_count: number;
  mix: CoverageMix | null;
  /** Imagen de artículo más reciente con foto (misma lógica que el hero de la ficha). */
  cover_image_url: string | null;
};

/**
 * Datos para OG image y metadatos de compartir (misma fuente que la página de historia).
 */
export async function fetchHistoriaShareFields(
  supabase: SupabaseClient,
  historiaId: string,
): Promise<HistoriaShareFields | null> {
  const { data: historia } = await supabase
    .from("historias")
    .select("titulo_canonico, resumen_canonico, medio_count, article_count")
    .eq("id", historiaId)
    .maybeSingle();

  if (!historia) return null;

  const { data: articulos } = await supabase
    .from("articulos")
    .select("medio_id, imagen_url, fecha_pub")
    .eq("historia_id", historiaId);

  const arts = articulos ?? [];
  const medioIds = [...new Set(arts.map((a) => a.medio_id))];

  const datedWithImg = arts
    .filter((a) => a.imagen_url)
    .sort((a, b) => {
      const ta = a.fecha_pub ? new Date(a.fecha_pub as string).getTime() : 0;
      const tb = b.fecha_pub ? new Date(b.fecha_pub as string).getTime() : 0;
      return tb - ta;
    });
  const cover_image_url =
    (datedWithImg[0]?.imagen_url as string | undefined) ?? null;

  if (medioIds.length === 0) {
    return {
      titulo_canonico: historia.titulo_canonico as string,
      resumen_canonico: (historia.resumen_canonico as string) ?? null,
      medio_count: Number(historia.medio_count ?? 0),
      article_count: Number(historia.article_count ?? 0),
      mix: null,
      cover_image_url,
    };
  }

  const { data: mediosRows } = await supabase
    .from("medios")
    .select("id, sesgo")
    .in("id", medioIds);

  const sesgoByMedio = new Map(
    (mediosRows ?? []).map((m) => [m.id as string, m.sesgo as string]),
  );
  const sesgos: string[] = [];
  for (const a of arts) {
    const s = sesgoByMedio.get(a.medio_id);
    if (s) sesgos.push(s);
  }
  const mix = coverageMixFromSesgos(sesgos);

  return {
    titulo_canonico: historia.titulo_canonico as string,
    resumen_canonico: (historia.resumen_canonico as string) ?? null,
    medio_count: Number(historia.medio_count ?? 0),
    article_count: Number(historia.article_count ?? 0),
    mix,
    cover_image_url,
  };
}
