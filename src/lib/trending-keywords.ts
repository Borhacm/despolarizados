/**
 * Tendencias tipo Ground News: términos concretos, sin preposiciones ni
 * palabras demasiado frecuentes en todo el corpus.
 */

const MIN_LEN = 5;
/** Si una palabra aparece en más del ~40 % de titulares, es demasiado genérica. */
const MAX_DOC_FREQ_RATIO = 0.42;
/** Mínimo de titulares distintos donde debe aparecer la palabra. */
const MIN_DISTINCT_TITLES = 2;

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9ñ]/g, "")
    .trim();
}

/**
 * Palabras funcionales y términos demasiado genéricos en prensa en español.
 * Incluye preposiciones, artículos, pronombres, verbos auxiliares habituales en titulares,
 * y plantillas editoriales (última hora, directo…).
 */
const TRENDING_STOP = new Set(
  [
    // artículos y contracciones
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
    // preposiciones y conjunciones
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
    // pronombres y demostrativos
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
    // verbos / auxiliares muy frecuentes en titulares
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
    "fue",
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
    "sido",
    "habra",
    "habrá",
    "serán",
    "estará",
    // adverbios y cuantificadores vagos
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
    // números / tiempo genérico
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
    // plantillas y meta-noticia
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
    // sustantivos/adjetivos demasiado genéricos en titulares (el TF‑IDF filtra el resto)
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

function tokenizeTitle(title: string): string[] {
  const raw = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  const parts = raw.split(/[^a-z0-9ñ]+/i).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const w = norm(p);
    if (w.length < MIN_LEN) continue;
    if (TRENDING_STOP.has(w)) continue;
    out.push(w);
  }
  return out;
}

/**
 * Extrae términos con mayor peso TF‑IDF aproximado (frecuencia × rareza entre titulares).
 * Evita preposiciones, palabras vacías y términos que aparecen en casi todos los titulares.
 */
export function trendingKeywordsFromTitles(
  titles: string[],
  max = 10,
): string[] {
  const cleaned = titles.map((t) => t.trim()).filter(Boolean);
  const N = cleaned.length;
  if (N === 0) return [];

  const tf = new Map<string, number>();
  const docCount = new Map<string, number>();

  for (const t of cleaned) {
    const seen = new Set<string>();
    const toks = tokenizeTitle(t);
    for (const w of toks) {
      tf.set(w, (tf.get(w) ?? 0) + 1);
      seen.add(w);
    }
    for (const w of seen) {
      docCount.set(w, (docCount.get(w) ?? 0) + 1);
    }
  }

  const scored: { w: string; score: number }[] = [];
  for (const [w, count] of tf) {
    const df = docCount.get(w) ?? 0;
    if (df < MIN_DISTINCT_TITLES || count < MIN_DISTINCT_TITLES) continue;
    if (df / N > MAX_DOC_FREQ_RATIO) continue;
    const idf = Math.log(2 + N / (1 + df));
    const score = count * idf;
    scored.push({ w, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.w);
}
