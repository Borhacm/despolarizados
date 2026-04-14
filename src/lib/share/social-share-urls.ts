/**
 * URLs de “compartir” por plataforma. Mantener codificación explícita y centralizada.
 */
import {
  historiaShareSnippet,
  historiaWhatsAppMessage,
} from "@/lib/share/historia-share-copy";

export function buildTwitterIntentUrl(canonicalUrl: string, title: string): string {
  const text = historiaShareSnippet(title);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(canonicalUrl)}`;
}

export function buildWhatsAppShareUrl(title: string, canonicalUrl: string): string {
  return `https://wa.me/?text=${encodeURIComponent(historiaWhatsAppMessage(title, canonicalUrl))}`;
}

export function buildRedditSubmitUrl(canonicalUrl: string, title: string): string {
  const t = historiaShareSnippet(title);
  return `https://www.reddit.com/submit?url=${encodeURIComponent(canonicalUrl)}&title=${encodeURIComponent(t)}`;
}

export function buildLinkedInShareUrl(canonicalUrl: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`;
}

export function buildFacebookShareUrl(canonicalUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`;
}
