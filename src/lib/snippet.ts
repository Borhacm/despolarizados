/**
 * Fragmento breve del texto de un medio. Mostramos solo unas frases y enlazamos al
 * original: los editores de prensa tienen derechos sobre sus publicaciones (RDL 24/2021)
 * y solo los fragmentos muy breves quedan claramente fuera.
 */
export const SNIPPET_DISPLAY_CHARS = 220;
export const SNIPPET_STORE_CHARS = 300;

export function snippet(text: string | null | undefined, max = SNIPPET_DISPLAY_CHARS): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentence = cut.lastIndexOf(". ");
  if (sentence > max * 0.6) return cut.slice(0, sentence + 1);
  const word = cut.lastIndexOf(" ");
  return `${cut.slice(0, word > 0 ? word : max).replace(/[,;:\s]+$/, "")}…`;
}
