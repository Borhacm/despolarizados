"use server";

import { verifyAdminSecret } from "@/lib/admin-secret";
import { medioInsertSchema, parseRssUrlsFromText } from "@/lib/medio-schema";
import { syncMediosSeed } from "@/lib/sync-medios-seed";
import { createServiceClient } from "@/lib/supabase/service";

export type AddMedioState =
  | null
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function addMedio(
  _prev: AddMedioState,
  formData: FormData,
): Promise<AddMedioState> {
  const adminSecret = formData.get("adminSecret");
  if (typeof adminSecret !== "string" || !verifyAdminSecret(adminSecret)) {
    return {
      ok: false,
      error:
        "Clave incorrecta o no configurada. Define ADMIN_SECRET o CRON_SECRET en .env.local.",
    };
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const rssText = String(formData.get("rss_urls") ?? "");
  const rss_urls = parseRssUrlsFromText(rssText);
  const sesgo = String(formData.get("sesgo") ?? "").trim();
  const factualidad = String(formData.get("factualidad") ?? "").trim();
  const ownershipRaw = String(formData.get("ownership") ?? "").trim();
  const ownership = ownershipRaw.length ? ownershipRaw : null;
  const prioridad = Number(formData.get("prioridad") ?? 3);
  const active = formData.get("active") === "on";

  const parsed = medioInsertSchema.safeParse({
    nombre,
    slug,
    rss_urls,
    sesgo,
    factualidad,
    ownership,
    prioridad: Number.isFinite(prioridad) ? prioridad : 3,
    active,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join(" · "),
    };
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("medios").insert({
      nombre: parsed.data.nombre,
      slug: parsed.data.slug,
      rss_urls: parsed.data.rss_urls,
      sesgo: parsed.data.sesgo,
      factualidad: parsed.data.factualidad,
      ownership: parsed.data.ownership ?? null,
      prioridad: parsed.data.prioridad,
      active: parsed.data.active ?? true,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, slug: parsed.data.slug };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export type SyncSeedMediosState =
  | null
  | { ok: true; count: number }
  | { ok: false; error: string };

export async function syncSeedMediosAction(
  _prev: SyncSeedMediosState,
  formData: FormData,
): Promise<SyncSeedMediosState> {
  const adminSecret = formData.get("adminSecret");
  if (typeof adminSecret !== "string" || !verifyAdminSecret(adminSecret)) {
    return {
      ok: false,
      error:
        "Clave incorrecta o no configurada. Define ADMIN_SECRET o CRON_SECRET en .env.local.",
    };
  }

  try {
    const supabase = createServiceClient();
    const { count, error } = await syncMediosSeed(supabase);
    if (error) return { ok: false, error };
    return { ok: true, count };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
