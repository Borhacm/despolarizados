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
  /** Umbral de fusión cuando el protagonista común aparece en la mitad o más de los titulares. */
  strongMergeThreshold?: number;
  /** Parecido medio mínimo de un artículo con el resto de su grupo (grupos de 5 o más). */
  outlierThreshold?: number;
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

/**
 * Nombres propios que NO identifican un hecho concreto: instituciones, países, partidos y
 * figuras omnipresentes. Con ellos como «protagonista» se colaban intrusos (el Tratado de
 * Amistad con Francia en la amnistía, por «Constitucional»).
 */
const GENERIC_ENTITIES = new Set(
  [
    "españa", "gobierno", "congreso", "senado", "constitucional", "supremo", "tribunal",
    "audiencia", "nacional", "estado", "estados", "unidos", "unión", "europa", "europea",
    "bruselas", "comisión", "consejo", "ministros", "ministerio", "interior", "defensa",
    "justicia", "hacienda", "sanidad", "vivienda", "policía", "guardia", "civil", "ejército",
    "fiscalía", "moncloa", "génova", "psoe", "sumar", "podemos", "junts", "vox", "otan",
    "onu", "sánchez", "trump", "feijóo", "madrid", "barcelona", "cataluña", "catalunya",
    "andalucía", "rusia", "ucrania", "china", "francia", "italia", "alemania", "marruecos",
    "israel", "irán", "venezuela", "portugal", "reino", "unido", "eeuu", "gaza", "última",
    "hora", "directo", "vídeo", "fotos", "podcast", "opinión", "así", "qué", "quién", "por",
    // Lugares: son temas, no hechos. «Ceuta» unía toda la crisis en un paraguas gigante.
    "ceuta", "melilla", "canarias", "baleares", "valencia", "sevilla", "málaga", "zaragoza",
    "bilbao", "murcia", "alicante", "granada", "córdoba", "cádiz", "galicia", "asturias",
    "aragón", "navarra", "euskadi", "país", "vasco", "castilla", "león", "mancha", "extremadura",
    "cantabria", "rioja", "palma", "tenerife", "vigo", "coruña", "oviedo", "valladolid",
    "salamanca", "toledo", "almería", "huelva", "jaén", "tarragona", "girona", "lleida",
    "nueva", "york", "washington", "londres", "parís", "berlín", "roma", "moscú", "pekín",
    "rabat", "tánger", "argelia", "europeo", "española", "español", "españoles",
  ].map((w) => w.normalize("NFD").replace(/[\u0300-\u036f]/g, "")),
);

const entityCache = new Map<string, Set<string>>();

/** Palabras con mayúscula inicial que no abren el titular: aproximación a nombres propios. */
function titleEntities(title: string): Set<string> {
  const cached = entityCache.get(title);
  if (cached) return cached;
  const words = title
    .replace(/&[a-z#0-9]+;/gi, " ")
    .split(/[\s,.;:!?¡¿"«»“”'‘’()|/-]+/)
    .filter(Boolean);
  const out = new Set<string>();
  words.forEach((w, i) => {
    if (i === 0 || w.length < 4) return;
    if (!/^\p{Lu}\p{Ll}/u.test(w)) return;
    const key = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!GENERIC_ENTITIES.has(key)) out.add(key);
  });
  entityCache.set(title, out);
  return out;
}

function entityCounts(g: Working): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of g.items) for (const e of titleEntities(it.titulo)) m.set(e, (m.get(e) ?? 0) + 1);
  return m;
}

/**
 * Fuerza del protagonista común: la mayor proporción mínima de titulares de ambos grupos
 * que comparten un mismo nombre propio no genérico (0 si no comparten ninguno). Un nombre
 * citado de pasada en un titular no basta para unir dos historias.
 */
function protagonistStrength(a: Working, b: Working): number {
  const ea = entityCounts(a);
  const eb = entityCounts(b);
  let best = 0;
  for (const [e, na] of ea) {
    const nb = eb.get(e);
    if (!nb) continue;
    best = Math.max(best, Math.min(na / a.items.length, nb / b.items.length));
  }
  return best;
}

function mergePass(
  groups: Working[],
  th: number,
  smallTh: number,
  smallMax: number,
  strongTh: number,
): Working[] {
  const live: (Working | null)[] = groups;
  const score = (i: number, j: number): number => {
    const a = live[i]!;
    const b = live[j]!;
    // Un ángulo concreto (3-4 piezas) rara vez alcanza el parecido medio con una historia
    // amplia de decenas de artículos: se le exige algo menos, siempre con protagonista común.
    const strength = protagonistStrength(a, b);
    if (strength < 0.2) return -1;
    // Cuanto más claro es el protagonista común (p. ej. «Maricarmen» en el 60 % o más de
    // los titulares de ambos), menos parecido semántico hace falta para unirlos.
    let t = Math.min(a.items.length, b.items.length) <= smallMax ? smallTh : th;
    if (strength >= 0.6) t = Math.min(t, strongTh);
    // Poda barata por centroide antes del cálculo caro.
    if (cosineSimilarity(a.centroid, b.centroid) < t - 0.03) return -1;
    const s = averageLinkage(a, b);
    return s >= t ? s : -1;
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

/**
 * Poda de intrusos: en grupos de 5 o más, un artículo cuyo parecido medio con el resto
 * queda por debajo del umbral sale del grupo y forma su propia historia.
 */
function pruneOutliers(groups: Working[], th: number): Working[] {
  const out: Working[] = [];
  for (const g of groups) {
    if (g.items.length < 5) {
      out.push(g);
      continue;
    }
    // Nombre propio dominante del grupo (en el 30 % o más de sus titulares): un artículo
    // que lo lleva no se expulsa aunque su ángulo sea distinto (p. ej. James Rhodes en el
    // desahucio de Maricarmen).
    const counts = entityCounts(g);
    const dominant = [...counts.entries()]
      .filter(([, n]) => n / g.items.length >= 0.3)
      .map(([e]) => e);
    const keep: RegroupItem[] = [];
    for (const it of g.items) {
      if (dominant.some((e) => titleEntities(it.titulo).has(e))) {
        keep.push(it);
        continue;
      }
      let sum = 0;
      for (const other of g.items) if (other !== it) sum += cosineSimilarity(it.emb, other.emb);
      const avg = sum / (g.items.length - 1);
      if (avg >= th) keep.push(it);
      else {
        if (process.env.REGROUP_DEBUG) console.error(`expulsado (${avg.toFixed(3)}): ${it.titulo.slice(0, 90)}`);
        out.push({ items: [it], centroid: it.emb, seed: it.emb, porMedio: new Map([[it.medioId, 1]]), lastMs: it.fechaMs });
      }
    }
    if (keep.length === 0) continue;
    const seedStill = keep.some((it) => it.emb === g.seed);
    const centroid = keep[0]!.emb.map((_, k) => keep.reduce((acc, it) => acc + it.emb[k]!, 0) / keep.length);
    const porMedio = new Map<string, number>();
    for (const it of keep) porMedio.set(it.medioId, (porMedio.get(it.medioId) ?? 0) + 1);
    out.push({
      items: keep,
      centroid,
      seed: seedStill ? g.seed : keep[0]!.emb,
      porMedio,
      lastMs: Math.max(...keep.map((it) => it.fechaMs)),
    });
  }
  return out;
}

export function regroupItems(items: RegroupItem[], opts: RegroupOptions = {}): RegroupGroup[] {
  const clusterThreshold = opts.clusterThreshold ?? 0.88;
  const mergeThreshold = opts.mergeThreshold ?? 0.87;
  const smallMergeThreshold = opts.smallMergeThreshold ?? Number(process.env.REGROUP_SMALL_TH ?? 0.86);
  const smallGroupMax = opts.smallGroupMax ?? 4;
  const windowMs = (opts.windowHours ?? 72) * 3600 * 1000;
  const maxPerMedio = opts.maxPerMedio ?? 2;
  const first = clusterPass(items, clusterThreshold, windowMs, maxPerMedio);
  const outlierThreshold = opts.outlierThreshold ?? Number(process.env.REGROUP_OUTLIER_TH ?? 0.85);
  const strongMergeThreshold = opts.strongMergeThreshold ?? Number(process.env.REGROUP_STRONG_TH ?? 0.84);
  const merged = mergePass(first, mergeThreshold, smallMergeThreshold, smallGroupMax, strongMergeThreshold);
  return pruneOutliers(merged, outlierThreshold).map(({ items: its, centroid, seed }) => ({
    items: its,
    centroid,
    seed,
  }));
}
