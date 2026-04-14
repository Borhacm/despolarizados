import { createServerSupabaseOrNull } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  slug: z.string().min(1).max(120),
  follow: z.boolean(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase no configurado" },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const { slug, follow } = parsed.data;

  const { data: medio, error: medErr } = await supabase
    .from("medios")
    .select("id")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (medErr || !medio?.id) {
    return NextResponse.json({ error: "Medio no encontrado" }, { status: 404 });
  }

  const medioId = medio.id as string;

  if (follow) {
    const { error: insErr } = await supabase.from("user_feed_medios").insert({
      user_id: user.id,
      medio_id: medioId,
    });
    if (
      insErr &&
      !insErr.message.includes("duplicate") &&
      insErr.code !== "23505"
    ) {
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }
  } else {
    const { error: delErr } = await supabase
      .from("user_feed_medios")
      .delete()
      .eq("user_id", user.id)
      .eq("medio_id", medioId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
