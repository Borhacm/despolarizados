/**
 * Eventos de producto en GA4 (propiedad G-BJ1YBDGMN9). gtag lo define AnalyticsConsent;
 * con el consentimiento denegado, Consent Mode envía solo pings sin cookies.
 *
 * Plan de eventos:
 * - outbound_click: clic a la noticia original (medio, lado, historia_id). Métrica central:
 *   ¿se lee más de un lado?
 * - story_open: apertura de una historia desde un listado (origen, tipo, historia_id).
 * - share: compartir (method: x, whatsapp, instagram, copy_link…; historia_id).
 * - filter_use / search: búsqueda y filtros del listado.
 * - trending_click, sort_change: tendencias y orden del listado.
 * - follow_medio: seguir o dejar de seguir un medio.
 * - newsletter_signup: alta en el boletín (frecuencia, ubicacion).
 */
type Params = Record<string, string | number | boolean | undefined>;

export function track(event: string, params: Params = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );
  window.gtag("event", event, clean);
}
