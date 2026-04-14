/** Orden explícito para elegir titular canónico (mayor = preferido). */
const RANK: Record<string, number> = {
  baja: 1,
  "media-baja": 1.5,
  media: 2,
  "media-alta": 3,
  alta: 4,
};

export function factualidadRank(label: string): number {
  const k = label.trim().toLowerCase();
  return RANK[k] ?? 2;
}

export function betterFactualidad(a: string, b: string): boolean {
  return factualidadRank(a) > factualidadRank(b);
}
