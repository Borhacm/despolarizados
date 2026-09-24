/**
 * Embeddings multilingües locales con transformers.js (modelo multilingual-e5-small,
 * 384 dimensiones). Vive fuera de `src/` a propósito: solo lo importa la ingesta por
 * script (GitHub Actions); si lo importara una ruta de Next, el modelo y onnxruntime
 * entrarían en las funciones de Vercel y superarían su tamaño máximo.
 */
const MODEL = process.env.LOCAL_EMBEDDING_MODEL ?? "Xenova/multilingual-e5-small";
const BATCH = 64;

type Extractor = (
  texts: string[],
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

let extractor: Extractor | null = null;

async function load(): Promise<Extractor> {
  if (extractor) return extractor;
  const { pipeline, env } = await import("@huggingface/transformers");
  if (process.env.TRANSFORMERS_CACHE_DIR) env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR;
  extractor = (await pipeline("feature-extraction", MODEL, { dtype: "q8" })) as unknown as Extractor;
  return extractor;
}

export async function embedTextsLocal(texts: string[]): Promise<number[][]> {
  const fx = await load();
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    // e5 espera el prefijo «query: » también en comparaciones simétricas.
    const chunk = texts.slice(i, i + BATCH).map((t) => `query: ${t.replace(/\s+/g, " ").trim()}`);
    const res = await fx(chunk, { pooling: "mean", normalize: true });
    out.push(...res.tolist());
  }
  return out;
}
