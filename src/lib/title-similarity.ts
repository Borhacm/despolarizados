/**
 * Agrupación sin ML: combina solapamiento de palabras (Jaccard) y bigramas de
 * caracteres (Dice / Jaccard en conjuntos), robusto a reordenaciones del titular.
 */

const STOP = new Set(
  [
    "the",
    "and",
    "los",
    "las",
    "una",
    "uno",
    "como",
    "para",
    "por",
    "con",
    "sin",
    "sobre",
    "entre",
    "tras",
    "hasta",
    "desde",
    "esta",
    "este",
    "estos",
    "estas",
    "ese",
    "esa",
    "eso",
    "sus",
    "son",
    "ser",
    "han",
    "hay",
    "más",
    "menos",
    "muy",
    "todo",
    "todos",
    "toda",
    "todas",
    "año",
    "años",
    "día",
    "días",
    "hoy",
    "ayer",
    "tras",
    "tras",
    "que",
    "del",
    "al",
    "el",
    "la",
    "le",
    "lo",
    "les",
    "ya",
    "fue",
    "fueron",
    "sido",
    "tiene",
    "tienen",
    "haber",
    "según",
    "cada",
    "vez",
    "dos",
    "tras",
    "ante",
    "tras",
    "tras",
    "noticias",
    "informa",
    "informó",
    "directo",
    "última",
    "hora",
  ].map((s) => normalizeToken(s)),
);

function normalizeToken(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

/**
 * Variantes típicas en prensa ES que describen el mismo hecho; unifica antes del
 * Jaccard para no partir clusters (p. ej. IPC vs inflación, carburantes vs combustibles).
 */
function collapseNewsSynonyms(t: string): string {
  return t
    .replace(/\bipc\b/g, "inflacion_ipc")
    .replace(/\binflacion\b/g, "inflacion_ipc")
    .replace(/\bcarburantes\b/g, "combustibles")
    .replace(/\bcombustibles\b/g, "combustibles")
    .replace(/\bgasolina\b/g, "combustibles")
    .replace(/\bgasoleo\b/g, "combustibles")
    .replace(/\balza\b/g, "subida")
    .replace(/\bsubida\b/g, "subida")
    .replace(/\bencarecimiento\b/g, "subida")
    .replace(/\bencarecimientos\b/g, "subida");
}

/** "3,4 %" / "3.4%" → token alfanumérico estable para cruzar medios. */
function normalizePercentFigures(t: string): string {
  return t
    .replace(/(\d),(\d)\s*%/g, "$1$2pct")
    .replace(/(\d)\.(\d)\s*%/g, "$1$2pct");
}

export function normalizeForMatch(text: string): string {
  let t = normalizeToken(text);
  t = normalizePercentFigures(t);
  t = collapseNewsSynonyms(t);
  return t.replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string): string[] {
  const n = normalizeForMatch(text);
  return n
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

function jaccardTokens(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const A = new Set(ta);
  const B = new Set(tb);
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter += 1;
  }
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Bigramas de caracteres alfanuméricos (incl. espacio colapsado). */
function charBigrams(s: string): Set<string> {
  const t = normalizeForMatch(s).replace(/\s/g, "");
  const out = new Set<string>();
  if (t.length < 2) return out;
  for (let i = 0; i < t.length - 1; i++) {
    out.add(t.slice(i, i + 2));
  }
  return out;
}

function jaccardSets(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Texto fusionado para comparar con el titular (y algo de contexto) de una historia.
 */
export function combinedArticleText(title: string, summary: string): string {
  const sum = summary.replace(/\s+/g, " ").trim().slice(0, 420);
  return `${title}\n${sum}`;
}

/** Sustantivos/roles genéricos: no sirven solos para deduplicar «mismo día, mismo ancla». */
const DEDUPE_ANCHOR_GENERIC = new Set(
  [
    "gobierno",
    "gobiernos",
    "presidente",
    "presidenta",
    "ministro",
    "ministra",
    "ministros",
    "comunidad",
    "comunidades",
    "nacional",
    "nacionales",
    "regional",
    "regionales",
    "municipal",
    "municipales",
    "español",
    "española",
    "españoles",
    "congreso",
    "senado",
    "parlamento",
    "asamblea",
    "pleno",
    "diputado",
    "diputada",
    "alcalde",
    "alcaldesa",
    "venezuela",
    "colombia",
    "argentina",
    "ucrania",
    "pakistan",
    "israel",
    "palestina",
    "españa",
    "espana",
  ].map((s) => normalizeToken(s)),
);

function dedupeAnchorTokenize(s: string): string[] {
  const n = normalizeForMatch(s);
  return n
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(
      (t) =>
        t.length >= 6 && !STOP.has(t) && !DEDUPE_ANCHOR_GENERIC.has(t),
    );
}

/**
 * Mismo hecho, titulares poco solapados (misma figura, mismo día). Solo para
 * el script de deduplicación post-carga, no aplica a la ingesta.
 */
/**
 * Misma regla de ancla pero solo nombres/entidades en **titulares** (el resumen
 * puede mezclar nombres del mismo ecosistema regional pese a hechos distintos).
 */
export function hasHistoriasSharedTitleOnlyDedupeAnchor(
  aTitle: string,
  bTitle: string,
): boolean {
  return hasHistoriasSharedDedupeAnchor(aTitle, "", bTitle, "");
}

export function hasHistoriasSharedDedupeAnchor(
  aTitle: string,
  aResumen: string | null,
  bTitle: string,
  bResumen: string | null,
): boolean {
  const ca = combinedArticleText(aTitle, aResumen ?? "");
  const cb = combinedArticleText(bTitle, bResumen ?? "");
  const ta = new Set(dedupeAnchorTokenize(ca));
  const tb = new Set(dedupeAnchorTokenize(cb));
  const inter = [...ta].filter((t) => tb.has(t));
  if (inter.length === 0) return false;
  if (inter.length >= 2) {
    if (inter.every((t) => t.length >= 6)) return true;
  }
  if (inter.length === 1 && (inter[0]!.length ?? 0) >= 8) return true;
  return false;
}

/**
 * Misma fecha de publicación (vía `ultima_pub` en ISO) para reforzar pares
 * de deduplicación; compara YYYY-MM-DD.
 */
export function samePublicacionDate(
  aUltima: string | null,
  bUltima: string | null,
): boolean {
  if (!aUltima || !bUltima) return false;
  return aUltima.slice(0, 10) === bUltima.slice(0, 10);
}

const TOKEN_W = 0.55;
const BIGRAM_W = 0.45;

/** 0–1; ~0.36 suele unir la misma noticia con redacciones distintas. */
export function similarityForClustering(a: string, b: string): number {
  const sa = combinedArticleText(a, "");
  const sb = combinedArticleText(b, "");
  const j = jaccardTokens(sa, sb);
  const bg = jaccardSets(charBigrams(sa), charBigrams(sb));
  return TOKEN_W * j + BIGRAM_W * bg;
}

/**
 * Similitud para agrupar: compara titular+resumen **y** solo titulares, y se
 * queda con el máximo. Así dos piezas del mismo hecho no se separan porque el
 * cuerpo/resumen del RSS añade términos distintos (caso típico en prensa).
 */
export function lexicalClusteringScore(
  incomingTitle: string,
  incomingSummary: string,
  historiaTitle: string,
  historiaSummary: string | null,
): number {
  const incoming = combinedArticleText(incomingTitle, incomingSummary);
  const sum = (historiaSummary ?? "").replace(/\s+/g, " ").trim().slice(0, 420);
  const cand = combinedArticleText(historiaTitle, sum);
  const full = similarityForClustering(incoming, cand);
  const titlesOnly = similarityForClustering(incomingTitle, historiaTitle);
  return Math.max(full, titlesOnly);
}

export function parseLexicalThreshold(): number {
  const raw = process.env.INGEST_LEXICAL_THRESHOLD?.trim();
  if (!raw) return 0.36;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0 || n >= 1) return 0.36;
  return n;
}
