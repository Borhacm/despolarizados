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

export function normalizeForMatch(text: string): string {
  return normalizeToken(text).replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ");
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

export function parseLexicalThreshold(): number {
  const raw = process.env.INGEST_LEXICAL_THRESHOLD?.trim();
  if (!raw) return 0.36;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0 || n >= 1) return 0.36;
  return n;
}
