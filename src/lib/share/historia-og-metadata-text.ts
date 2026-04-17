import type { HistoriaShareFields } from "@/lib/historia-share";

/** Mismo título que `openGraph.title` y la imagen OG (titular canónico). */
export function historiaOgOpenGraphTitle(tituloCanonico: string): string {
  return tituloCanonico.trim();
}

/** Misma lógica que `openGraph.description` en `generateMetadata`. */
export function historiaOgOpenGraphDescription(
  fields: Pick<
    HistoriaShareFields,
    "resumen_canonico" | "medio_count" | "article_count"
  >,
): string {
  return (
    fields.resumen_canonico?.slice(0, 160) ??
    `Comparativa de medios: ${fields.medio_count} medios, ${fields.article_count} artículos.`
  );
}

/** `<title>` del documento (acortado). */
export function historiaDocumentTitleShort(tituloCanonico: string): string {
  const t = tituloCanonico.trim();
  return t.length > 58 ? `${t.slice(0, 55)}…` : t;
}
