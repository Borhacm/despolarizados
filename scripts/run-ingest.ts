import { config } from "dotenv";
import { resolve } from "node:path";

/**
 * Carga `.env.local`: `override` evita que un `SUPABASE_SERVICE_ROLE_KEY` vacío
 * en el entorno del proceso tape el JWT del fichero.
 */
config({
  path: resolve(process.cwd(), ".env.local"),
  override: true,
  quiet: true,
});

import { getIngestClusterMode, ingestRequiresOpenAI } from "../src/lib/ingest-mode";
import { runIngest } from "../src/lib/ingest";
import { createServiceClient } from "../src/lib/supabase/service";

async function main() {
  if (ingestRequiresOpenAI() && !process.env.OPENAI_API_KEY?.trim()) {
    console.error(
      "Modo openai: falta OPENAI_API_KEY. Para agrupación sin API, usa INGEST_CLUSTER_MODE=lexical o elimina la clave.",
    );
    process.exit(1);
  }
  const supabase = createServiceClient();
  const embed =
    getIngestClusterMode() === "local"
      ? (await import("./local-embeddings")).embedTextsLocal
      : undefined;
  const result = await runIngest(supabase, { embed });
  console.log(JSON.stringify(result, null, 2));
  // Un feed caído no es un fallo de la ejecución; sí lo es no procesar ninguno.
  // Salida explícita: onnxruntime (modo local) deja hilos vivos y el proceso no
  // terminaba; en GitHub Actions eso agotaba el tiempo del job.
  process.exit(result.feedsProcessed === 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
