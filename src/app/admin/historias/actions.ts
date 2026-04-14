"use server";

import { verifyAdminSecret } from "@/lib/admin-secret";
import { mergeHistoriasInto } from "@/lib/merge-historias";
import { createServiceClient } from "@/lib/supabase/service";

export type MergeHistoriasState =
  | null
  | {
      ok: true;
      articlesMoved: number;
      targetId: string;
      removedHistoriaId: string;
    }
  | { ok: false; error: string };

export async function mergeHistoriasAction(
  _prev: MergeHistoriasState,
  formData: FormData,
): Promise<MergeHistoriasState> {
  const adminSecret = formData.get("adminSecret");
  if (typeof adminSecret !== "string" || !verifyAdminSecret(adminSecret)) {
    return {
      ok: false,
      error:
        "Clave incorrecta o no configurada. Define ADMIN_SECRET o CRON_SECRET en .env.local.",
    };
  }

  const targetId = formData.get("targetHistoriaId");
  const sourceId = formData.get("sourceHistoriaId");
  if (typeof targetId !== "string" || typeof sourceId !== "string") {
    return { ok: false, error: "Faltan UUID de historia." };
  }

  try {
    const supabase = createServiceClient();
    const result = await mergeHistoriasInto(supabase, targetId, sourceId);
    return { ok: true, ...result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
