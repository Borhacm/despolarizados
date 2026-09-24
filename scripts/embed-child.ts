/**
 * Proceso hijo que calcula embeddings con transformers.js. Protocolo por líneas JSON:
 * recibe {"id":n,"texts":[...]} por stdin y responde {"id":n,"embs":[[...]]} por stdout.
 * Vive aparte porque onnxruntime aborta el proceso al salir («mutex lock failed»); el
 * padre lo mata al terminar y sale limpio.
 */
import { createInterface } from "node:readline";

const MODEL = process.env.LOCAL_EMBEDDING_MODEL ?? "Xenova/multilingual-e5-small";
const BATCH = 64;

type Extractor = (
  texts: string[],
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

async function main() {
  const { pipeline, env } = await import("@huggingface/transformers");
  if (process.env.TRANSFORMERS_CACHE_DIR) env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR;
  const fx = (await pipeline("feature-extraction", MODEL, { dtype: "q8" })) as unknown as Extractor;
  const rl = createInterface({ input: process.stdin });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const { id, texts } = JSON.parse(line) as { id: number; texts: string[] };
    try {
      const embs: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH) {
        // e5 espera el prefijo «query: » también en comparaciones simétricas.
        const chunk = texts.slice(i, i + BATCH).map((t) => `query: ${t.replace(/\s+/g, " ").trim()}`);
        embs.push(...(await fx(chunk, { pooling: "mean", normalize: true })).tolist());
      }
      process.stdout.write(`${JSON.stringify({ id, embs })}\n`);
    } catch (e) {
      process.stdout.write(`${JSON.stringify({ id, error: e instanceof Error ? e.message : String(e) })}\n`);
    }
  }
}

void main();
