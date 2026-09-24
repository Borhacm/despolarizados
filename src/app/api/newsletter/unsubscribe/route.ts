import { createServiceClient } from "@/lib/supabase/service";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET no da de baja: los filtros antispam visitan los enlaces de los correos y borraban
 * suscripciones sin que nadie lo pidiera. Lleva a /baja, que pide confirmación.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  return NextResponse.redirect(`${getAppBaseUrl()}/baja?token=${encodeURIComponent(token)}`);
}

/**
 * Baja efectiva: desde el formulario de /baja (campo `token`) o desde la baja en un clic
 * de Gmail/Yahoo (RFC 8058: POST a la URL de List-Unsubscribe con el token en la query).
 */
export async function POST(request: Request) {
  const base = getAppBaseUrl();
  const url = new URL(request.url);
  let token = url.searchParams.get("token")?.trim() ?? "";
  const oneClick = Boolean(token);
  if (!token) {
    const form = await request.formData().catch(() => null);
    token = String(form?.get("token") ?? "").trim();
  }
  if (!token) return NextResponse.redirect(`${base}/?newsletter=invalid`, 303);

  try {
    const { error } = await createServiceClient()
      .from("newsletter_subscribers")
      .delete()
      .eq("unsubscribe_token", token);
    if (error) throw error;
    return oneClick
      ? new NextResponse(null, { status: 200 })
      : NextResponse.redirect(`${base}/?newsletter=unsubscribed`, 303);
  } catch {
    return oneClick
      ? new NextResponse(null, { status: 500 })
      : NextResponse.redirect(`${base}/?newsletter=error`, 303);
  }
}
