export const FEED_COOKIE = "despolarizados_feed";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lista de slugs separados por comas; máx. 40 entradas. */
export function parseFeedSlugs(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    if (out.length >= 40) break;
    if (SLUG_RE.test(p) && !seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

export function serializeFeedSlugs(slugs: string[]): string {
  return slugs.filter((s) => SLUG_RE.test(s)).slice(0, 40).join(",");
}
