/**
 * Algunos RSS escapan dos veces el texto: el titular llega como `&quot;Hola&quot;` y se
 * mostraba tal cual en la web y en los correos. Decodificamos las entidades al ingerir.
 */
const NAMED: Record<string, string> = {
  quot: '"',
  apos: "'",
  amp: "&",
  lt: "<",
  gt: ">",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  iexcl: "¡",
  iquest: "¿",
};

export function decodeHtmlEntities(text: string): string {
  let out = text;
  // Dos pasadas: cubre el doble escapado (`&amp;quot;` → `&quot;` → `"`).
  for (let i = 0; i < 2; i++) {
    out = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
      if (code[0] === "#") {
        const n = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : m;
      }
      return NAMED[code.toLowerCase()] ?? m;
    });
  }
  return out;
}
