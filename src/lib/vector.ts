export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export function mergeEmbeddings(
  existing: number[] | null,
  existingCount: number,
  incoming: number[],
): number[] {
  if (!existing || existing.length !== incoming.length) {
    return incoming;
  }
  const n = existingCount + 1;
  return existing.map((v, i) => (v * existingCount + incoming[i]) / n);
}

export function parseVector(raw: unknown): number[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    return raw.every((x) => typeof x === "number") ? (raw as number[]) : null;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as number[]) : null;
    } catch {
      return null;
    }
  }
  return null;
}
