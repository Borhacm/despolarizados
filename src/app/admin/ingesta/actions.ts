"use server";

import { verifyAdminSecret } from "@/lib/admin-secret";
import { ingestRequiresOpenAI } from "@/lib/ingest-mode";
import { runIngest, type IngestResult } from "@/lib/ingest";
import { createServiceClient } from "@/lib/supabase/service";

export type IngestaState =
  | null
  | { ok: true; result: IngestResult }
  | { ok: false; error: string };

export async function runIngestaAction(
  _prev: IngestaState,
  formData: FormData,
): Promise<IngestaState> {
  const adminSecret = formData.get("adminSecret");
  if (typeof adminSecret !== "string" || !verifyAdminSecret(adminSecret)) {
    return {
      ok: false,
      error:
        "Clave incorrecta o no configurada. Define ADMIN_SECRET o CRON_SECRET en .env.local.",
    };
  }

  if (ingestRequiresOpenAI() && !process.env.OPENAI_API_KEY?.trim()) {
    return {
      ok: false,
      error:
        "Modo agrupación openai: falta OPENAI_API_KEY. Sin OpenAI, deja la variable vacía o define INGEST_CLUSTER_MODE=lexical.",
    };
  }

  try {
    const supabase = createServiceClient();
    const result = await runIngest(supabase);
    return { ok: true, result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
