const BRAND_SUFFIX = "Despolarizados";

/** Texto corto para tweets y mensajes (marca al final). */
export function historiaShareSnippet(title: string): string {
  const t = title.trim();
  return `${t} — ${BRAND_SUFFIX}`;
}

/** Leyenda Instagram: titular + URL en líneas separadas (mejor pegado en la app). */
export function historiaInstagramCaption(title: string, canonicalUrl: string): string {
  const snippet = historiaShareSnippet(title);
  return `${snippet}\n\n${canonicalUrl.trim()}`;
}

/** WhatsApp: un solo bloque con espacio entre snippet y URL. */
export function historiaWhatsAppMessage(title: string, canonicalUrl: string): string {
  return `${historiaShareSnippet(title)} ${canonicalUrl.trim()}`;
}
