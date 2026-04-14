/**
 * Tendencias: términos concretos (unigramas y bigramas) con TF‑IDF aproximado,
 * sin preposiciones ni palabras demasiado frecuentes en todo el corpus.
 */

const MIN_UNIGRAM_LEN = 5;
const MIN_BIGRAM_PART_LEN = 4;
/** Si una palabra aparece en más del ~40 % de titulares, es demasiado genérica. */
const MAX_DOC_FREQ_RATIO = 0.42;
/** Mínimo de titulares distintos donde debe aparecer el término. */
const MIN_DISTINCT_TITLES = 2;
/** Bigramas que entran antes que rellenar con unigramas (hasta este tope). */
const MAX_BIGRAMS_PREFERRED = 4;

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9ñ]/g, "")
    .trim();
}

function prettifySurface(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  const lower = t.toLocaleLowerCase("es");
  return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
}

/**
 * Palabras funcionales y términos demasiado genéricos en prensa en español.
 */
const TRENDING_STOP = new Set(
  [
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "lo",
    "al",
    "del",
    "a",
    "ante",
    "bajo",
    "cabe",
    "con",
    "contra",
    "de",
    "desde",
    "durante",
    "en",
    "entre",
    "hacia",
    "hasta",
    "mediante",
    "para",
    "por",
    "segun",
    "según",
    "sin",
    "sobre",
    "tras",
    "versus",
    "via",
    "vía",
    "y",
    "e",
    "ni",
    "o",
    "u",
    "que",
    "como",
    "cuando",
    "cuándo",
    "donde",
    "dónde",
    "mientras",
    "aunque",
    "pero",
    "sino",
    "porque",
    "pues",
    "yo",
    "tu",
    "tú",
    "ella",
    "ello",
    "nos",
    "nosotros",
    "vosotros",
    "ellos",
    "ellas",
    "me",
    "te",
    "se",
    "le",
    "les",
    "mi",
    "mis",
    "su",
    "sus",
    "este",
    "esta",
    "esto",
    "estos",
    "estas",
    "ese",
    "esa",
    "eso",
    "esos",
    "esas",
    "aquel",
    "aquella",
    "aquello",
    "mismo",
    "misma",
    "mismos",
    "mismas",
    "otro",
    "otra",
    "otros",
    "otras",
    "algo",
    "nada",
    "alguien",
    "nadie",
    "quien",
    "quién",
    "cual",
    "cuál",
    "cuyo",
    "cuya",
    "todo",
    "toda",
    "todos",
    "todas",
    "cada",
    "cualquier",
    "varios",
    "varias",
    "es",
    "son",
    "ser",
    "soy",
    "somos",
    "era",
    "eran",
    "fue",
    "fueron",
    "sido",
    "siendo",
    "sera",
    "será",
    "estar",
    "está",
    "están",
    "estaba",
    "hay",
    "haber",
    "ha",
    "han",
    "he",
    "hemos",
    "habia",
    "había",
    "tiene",
    "tienen",
    "tuvo",
    "hace",
    "hacen",
    "hizo",
    "hicieron",
    "dice",
    "dijo",
    "van",
    "va",
    "voy",
    "ir",
    "iba",
    "puede",
    "pueden",
    "podria",
    "podría",
    "debe",
    "deben",
    "quiere",
    "quieren",
    "habra",
    "habrá",
    "serán",
    "estará",
    "muy",
    "mas",
    "más",
    "menos",
    "tan",
    "tanto",
    "tanta",
    "asi",
    "así",
    "aqui",
    "aquí",
    "allí",
    "ahora",
    "ayer",
    "hoy",
    "mañana",
    "despues",
    "después",
    "antes",
    "tambien",
    "también",
    "tampoco",
    "solo",
    "sólo",
    "ya",
    "aun",
    "aún",
    "apenas",
    "casi",
    "poco",
    "poca",
    "muchos",
    "muchas",
    "mucho",
    "mucha",
    "bastante",
    "demasiado",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "diez",
    "cien",
    "mil",
    "año",
    "años",
    "mes",
    "meses",
    "dia",
    "día",
    "dias",
    "días",
    "hora",
    "horas",
    "semana",
    "minuto",
    "minutos",
    "segundo",
    "noticias",
    "noticia",
    "ultima",
    "última",
    "ultimo",
    "último",
    "directo",
    "directos",
    "informa",
    "informó",
    "informe",
    "segun",
    "fuentes",
    "fuente",
    "según",
    "lee",
    "ver",
    "video",
    "vídeo",
    "fotos",
    "foto",
    "galeria",
    "galería",
    "actualidad",
    "portada",
    "titulares",
    "titular",
    "resumen",
    "breaking",
    "live",
    "news",
    "gobierno",
    "presidente",
    "presidenta",
    "ministro",
    "ministra",
    "estado",
    "pais",
    "país",
    "mundo",
    "personas",
    "persona",
    "millones",
    "millon",
    "millón",
    "nacional",
    "internacional",
    "politica",
    "política",
    "economia",
    "economía",
    "sociedad",
    "deportes",
    "cultura",
    "medio",
    "medios",
    "prensa",
    "digital",
    "redes",
    "social",
    "sociales",
    "informacion",
    "información",
    "seguridad",
    "crisis",
    "nuevo",
    "nueva",
    "nuevos",
    "nuevas",
    "primer",
    "primera",
    "primeros",
    "primeras",
    "grandes",
    "mayor",
    "mayores",
    "importante",
    "importantes",
    "general",
    "generales",
  ].map((w) => norm(w)),
);

export type TrendTerm = {
  /** Texto de búsqueda (`?q=`), alineado con la etiqueta mostrada. */
  q: string;
  /** Misma cadena legible para el chip (p. ej. “Inteligencia artificial”). */
  label: string;
};

type Token = { norm: string; surface: string };

function extractTokens(title: string): Token[] {
  const re = /[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]+/gi;
  const out: Token[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(title)) !== null) {
    const surface = m[0];
    const w = norm(surface);
    if (w.length < MIN_UNIGRAM_LEN) continue;
    if (TRENDING_STOP.has(w)) continue;
    out.push({ norm: w, surface });
  }
  return out;
}

function scoreTerms(
  titles: string[],
): {
  uniTf: Map<string, number>;
  uniDf: Map<string, number>;
  biTf: Map<string, number>;
  biDf: Map<string, number>;
  uniLabel: Map<string, string>;
  biLabel: Map<string, string>;
} {
  const uniTf = new Map<string, number>();
  const uniDf = new Map<string, number>();
  const biTf = new Map<string, number>();
  const biDf = new Map<string, number>();
  const uniLabel = new Map<string, string>();
  const biLabel = new Map<string, string>();

  for (const title of titles) {
    const toks = extractTokens(title);
    for (const t of toks) {
      if (!uniLabel.has(t.norm)) {
        uniLabel.set(t.norm, prettifySurface(t.surface));
      }
    }

    const seenUni = new Set<string>();
    for (const w of toks.map((x) => x.norm)) {
      uniTf.set(w, (uniTf.get(w) ?? 0) + 1);
      seenUni.add(w);
    }
    for (const w of seenUni) {
      uniDf.set(w, (uniDf.get(w) ?? 0) + 1);
    }

    for (let i = 0; i < toks.length - 1; i++) {
      const a = toks[i];
      const b = toks[i + 1];
      if (a.norm === b.norm) continue;
      if (a.norm.length < MIN_BIGRAM_PART_LEN || b.norm.length < MIN_BIGRAM_PART_LEN)
        continue;
      const key = `${a.norm} ${b.norm}`;
      const label = `${prettifySurface(a.surface)} ${prettifySurface(b.surface)}`;
      if (!biLabel.has(key)) biLabel.set(key, label);
      biTf.set(key, (biTf.get(key) ?? 0) + 1);
    }

    const seenBi = new Set<string>();
    for (let i = 0; i < toks.length - 1; i++) {
      const a = toks[i];
      const b = toks[i + 1];
      if (a.norm === b.norm) continue;
      if (a.norm.length < MIN_BIGRAM_PART_LEN || b.norm.length < MIN_BIGRAM_PART_LEN)
        continue;
      const key = `${a.norm} ${b.norm}`;
      seenBi.add(key);
    }
    for (const k of seenBi) {
      biDf.set(k, (biDf.get(k) ?? 0) + 1);
    }
  }

  return { uniTf, uniDf, biTf, biDf, uniLabel, biLabel };
}

function tfIdfScore(count: number, df: number, N: number): number {
  if (df < MIN_DISTINCT_TITLES || count < MIN_DISTINCT_TITLES) return 0;
  if (df / N > MAX_DOC_FREQ_RATIO) return 0;
  const idf = Math.log(2 + N / (1 + df));
  return count * idf;
}

/**
 * Términos con mayor peso TF‑IDF (unigramas y bigramas). Primero se eligen
 * bigramas no solapados; luego unigramas que no chocan con palabras ya usadas.
 */
export function trendingTermsFromTitles(
  titles: string[],
  max = 10,
): TrendTerm[] {
  const cleaned = titles.map((t) => t.trim()).filter(Boolean);
  const N = cleaned.length;
  if (N === 0) return [];

  const { uniTf, uniDf, biTf, biDf, uniLabel, biLabel } = scoreTerms(cleaned);

  type Scored = { score: number; key: string; label: string; kind: "uni" | "bi" };
  const pool: Scored[] = [];

  for (const [w, count] of uniTf) {
    const df = uniDf.get(w) ?? 0;
    const s = tfIdfScore(count, df, N);
    if (s <= 0) continue;
    const label = uniLabel.get(w) ?? w;
    pool.push({ score: s, key: w, label, kind: "uni" });
  }

  for (const [key, count] of biTf) {
    const df = biDf.get(key) ?? 0;
    const s = tfIdfScore(count, df, N);
    if (s <= 0) continue;
    const label = biLabel.get(key) ?? key;
    pool.push({ score: s * 1.15, key, label, kind: "bi" });
  }

  const bigrams = pool
    .filter((p) => p.kind === "bi")
    .sort((a, b) => b.score - a.score);
  const unigrams = pool
    .filter((p) => p.kind === "uni")
    .sort((a, b) => b.score - a.score);

  const out: TrendTerm[] = [];
  const usedNorms = new Set<string>();

  let bigramsAdded = 0;
  for (const b of bigrams) {
    if (out.length >= max) break;
    if (bigramsAdded >= MAX_BIGRAMS_PREFERRED) break;
    const parts = b.key.split(" ");
    if (parts.some((p) => usedNorms.has(p))) continue;
    for (const p of parts) usedNorms.add(p);
    out.push({ q: b.label, label: b.label });
    bigramsAdded += 1;
  }

  for (const u of unigrams) {
    if (out.length >= max) break;
    if (usedNorms.has(u.key)) continue;
    usedNorms.add(u.key);
    out.push({ q: u.label, label: u.label });
  }

  return out;
}
