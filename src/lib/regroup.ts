import { hasHistoriasSharedTitleOnlyDedupeAnchor } from "@/lib/title-similarity";
import { cosineSimilarity, mergeEmbeddings } from "@/lib/vector";

/**
 * Reagrupado de artículos en historias con embeddings, en dos fases:
 *
 * 1. Agrupado estricto: cada artículo se compara con el centroide y con el artículo
 *    fundador de cada grupo (evita la deriva), con ventana temporal y tope por medio.
 * 2. Fusión: une grupos del mismo hecho que el paso 1 dejó partidos (p. ej. el desahucio
 *    de Maricarmen salía en tres). Exige parecido medio entre TODOS los artículos de ambos
 *    grupos (resiste cadenas A~B~C) y un protagonista común en los titulares.
 *
 * Umbrales calibrados el 25 sept 2026 sobre 1.188 artículos de 48 h con
 * multilingual-e5-small, revisando el contenido de los grupos (no solo recuentos).
 */

export type RegroupItem = {
  id: string;
  historiaId: string | null;
  medioId: string;
  titulo: string;
  fechaMs: number;
  emb: number[];
};

export type RegroupGroup = {
  items: RegroupItem[];
  centroid: number[];
  seed: number[];
};

export type RegroupOptions = {
  clusterThreshold?: number;
  mergeThreshold?: number;
  /** Umbral de fusión cuando uno de los grupos es pequeño (satélites de una historia grande). */
  smallMergeThreshold?: number;
  smallGroupMax?: number;
  windowHours?: number;
  maxPerMedio?: number;
};

type Working = RegroupGroup & { porMedio: Map<string, number>; lastMs: number };

function clusterPass(items: RegroupItem[], th: number, windowMs: number, maxPerMedio: number): Working[] {
  const out: Working[] = [];
  const sorted = [...items].sort((a, b) => a.fechaMs - b.fechaMs);
  for (const it of sorted) {
    let best: Working | null = null;
    let bestScore = -1;
    for (const g of out) {
      if (Math.abs(it.fechaMs - g.lastMs) > windowMs) continue;
      if ((g.porMedio.get(it.medioId) ?? 0) >= maxPerMedio) continue;
      const s = Math.min(cosineSimilarity(it.emb, g.centroid), cosineSimilarity(it.emb, g.seed));
      if (s >= th && s > bestScore) {
        bestScore = s;
        best = g;
      }
    }
    if (best) {
      best.centroid = mergeEmbeddings(best.centroid, best.items.length, it.emb);
      best.items.push(it);
      best.porMedio.set(it.medioId, (best.porMedio.get(it.medioId) ?? 0) + 1);
      best.lastMs = Math.max(best.lastMs, it.fechaMs);
    } else {
      out.push({
        items: [it],
        centroid: it.emb,
        seed: it.emb,
        porMedio: new Map([[it.medioId, 1]]),
        lastMs: it.fechaMs,
      });
    }
  }
  return out;
}

function averageLinkage(a: Working, b: Working): number {
  let sum = 0;
  for (const x of a.items) for (const y of b.items) sum += cosineSimilarity(x.emb, y.emb);
  return sum / (a.items.length * b.items.length);
}

function sharesProtagonist(a: Working, b: Working): boolean {
  for (const x of a.items) {
    for (const y of b.items) {
      if (hasHistoriasSharedTitleOnlyDedupeAnchor(x.titulo, y.titulo)) return true;
    }
  }
  return false;
}

function mergePass(groups: Working[], th: number, smallTh: number, smallMax: number): Working[] {
  const live: (Working | null)[] = groups;
  const score = (i: number, j: number): number => {
    const a = live[i]!;
    const b = live[j]!;
    // Un ángulo concreto (3-4 piezas) rara vez alcanza el parecido medio con una historia
    // amplia de decenas de artículos: se le exige algo menos, siempre con protagonista común.
    const t = Math.min(a.items.length, b.items.length) <= smallMax ? smallTh : th;
    // Poda barata por centroide antes del cálculo caro.
    if (cosineSimilarity(a.centroid, b.centroid) < t - 0.02) return -1;
    const s = averageLinkage(a, b);
    return s >= t && sharesProtagonist(a, b) ? s : -1;
  };
  let pairs: [number, number, number][] = [];
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const s = score(i, j);
      if (s > 0) pairs.push([i, j, s]);
    }
  }
  for (;;) {
    pairs = pairs.filter(([i, j]) => live[i] && live[j]);
    if (pairs.length === 0) break;
    pairs.sort((x, y) => y[2] - x[2]);
    const [i, j] = pairs[0]!;
    const a = live[i]!;
    const b = live[j]!;
    const n = a.items.length + b.items.length;
    a.centroid = a.centroid.map((v, k) => (v * a.items.length + b.centroid[k]! * b.items.length) / n);
    a.items.push(...b.items);
    for (const [m, c] of b.porMedio) a.porMedio.set(m, (a.porMedio.get(m) ?? 0) + c);
    a.lastMs = Math.max(a.lastMs, b.lastMs);
    live[j] = null;
    pairs = pairs.filter(([x, y]) => x !== i && y !== i && x !== j && y !== j);
    for (let k = 0; k < live.length; k++) {
      if (k === i || !live[k]) continue;
      const lo = Math.min(i, k);
      const hi = Math.max(i, k);
      const s = score(lo, hi);
      if (s > 0) pairs.push([lo, hi, s]);
    }
  }
  return live.filter((g): g is Working => g !== null);
}

export function regroupItems(items: RegroupItem[], opts: RegroupOptions = {}): RegroupGroup[] {
  const clusterThreshold = opts.clusterThreshold ?? 0.88;
  const mergeThreshold = opts.mergeThreshold ?? 0.87;
  const smallMergeThreshold = opts.smallMergeThreshold ?? Number(process.env.REGROUP_SMALL_TH ?? 0.85);
  const smallGroupMax = opts.smallGroupMax ?? 4;
  const windowMs = (opts.windowHours ?? 72) * 3600 * 1000;
  const maxPerMedio = opts.maxPerMedio ?? 2;
  const first = clusterPass(items, clusterThreshold, windowMs, maxPerMedio);
  return mergePass(first, mergeThreshold, smallMergeThreshold, smallGroupMax).map(({ items: its, centroid, seed }) => ({
    items: its,
    centroid,
    seed,
  }));
}
