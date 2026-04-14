/**
 * `openai`: embeddings 1536d (requiere OPENAI_API_KEY).
 * `lexical`: similitud de titular/resumen en el servidor, sin llamadas externas.
 *
 * Por defecto: **léxico** (sin API externa). OpenAI solo si defines
 * `INGEST_CLUSTER_MODE=openai` (tener `OPENAI_API_KEY` ya no cambia el modo solo).
 */
export type IngestClusterMode = "openai" | "lexical";

export function getIngestClusterMode(): IngestClusterMode {
  const explicit = process.env.INGEST_CLUSTER_MODE?.trim().toLowerCase();
  if (explicit === "openai") return "openai";
  if (explicit === "lexical") return "lexical";
  return "lexical";
}

export function ingestRequiresOpenAI(): boolean {
  return getIngestClusterMode() === "openai";
}
