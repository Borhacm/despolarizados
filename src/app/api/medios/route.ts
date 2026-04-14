import { medioInsertSchema } from "@/lib/medio-schema";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const apiBodySchema = medioInsertSchema.extend({
  prioridad: medioInsertSchema.shape.prioridad.optional(),
  active: medioInsertSchema.shape.active.optional(),
});

/**
 * Alta de medios vía API (misma clave que el cron).
 * Escalable: un insert en `medios` + feeds RSS.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = apiBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validación", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("medios")
    .insert({
      nombre: parsed.data.nombre,
      slug: parsed.data.slug,
      rss_urls: parsed.data.rss_urls,
      sesgo: parsed.data.sesgo,
      factualidad: parsed.data.factualidad,
      ownership: parsed.data.ownership ?? null,
      prioridad: parsed.data.prioridad ?? 3,
      active: parsed.data.active ?? true,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return NextResponse.json({ ok: true, medio: data });
}
