/**
 * Detección de móvil para flujos de compartir imagen (p. ej. Instagram en el sheet nativo).
 * No existe API web oficial hacia Instagram: el mejor contrato es Web Share + archivo + portapapeles.
 */

export function isMobileShareContext(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  if (!isIOS && !isAndroid) return false;
  return window.matchMedia("(max-width: 767px)").matches;
}
