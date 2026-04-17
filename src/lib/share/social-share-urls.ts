/**
 * URLs de compartir por plataforma.
 *
 * WhatsApp / X / Reddit: cuando el mensaje es solo el enlace (o título = og:title),
 * la vista previa en la app coincide con lo que generan og:title, og:description y og:image.
 * Si se rellena mucho texto manual, la tarjeta sigue saliendo del enlace,
 * pero el usuario ve duplicado titular + preview.
 */
export function buildTwitterIntentUrl(canonicalUrl: string): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}`;
}

/** Solo el enlace: la vista previa de WhatsApp usa los metadatos Open Graph del URL. */
export function buildWhatsAppShareUrl(canonicalUrl: string): string {
  return `https://wa.me/?text=${encodeURIComponent(canonicalUrl.trim())}`;
}

/** Título del post = titular canónico (igual que og:title). */
export function buildRedditSubmitUrl(canonicalUrl: string, tituloCanonico: string): string {
  return `https://www.reddit.com/submit?url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(tituloCanonico.trim())}`;
}

export function buildLinkedInShareUrl(canonicalUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`;
}

export function buildFacebookShareUrl(canonicalUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`;
}
