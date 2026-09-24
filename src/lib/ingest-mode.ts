/**
 * `local`: embeddings multilingües calculados en la máquina que ejecuta la ingesta
 *   (modelo abierto multilingual-e5-small, 384 dimensiones, gratis). Solo desde
 *   `scripts/run-ingest.ts` (GitHub Actions); no cabe en una función de Vercel.
 * `openai`: embeddings de OpenAI (requiere OPENAI_API_KEY con saldo).
 * `lexical`: similitud de titular/resumen en el servidor, sin modelos.
 *
 * Por defecto: **léxico**. Se cambia con `INGEST_CLUSTER_MODE`.
 */
export type IngestClusterMode = "local" | "openai" | "lexical";

export function getIngestClusterMode(): IngestClusterMode {
  const explicit = process.env.INGEST_CLUSTER_MODE?.trim().toLowerCase();
  if (explicit === "local") return "local";
  if (explicit === "openai") return "openai";
  return "lexical";
}

export function ingestRequiresOpenAI(): boolean {
  return getIngestClusterMode() === "openai";
}
