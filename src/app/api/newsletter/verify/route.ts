import { createServiceClient } from "@/lib/supabase/service";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  const base = getAppBaseUrl();

  if (!token) {
    return NextResponse.redirect(`${base}/?newsletter=invalid`);
  }

  try {
    const supabase = createServiceClient();
    const { data: row, error: findErr } = await supabase
      .from("newsletter_subscribers")
      .select("id")
      .eq("verification_token", token)
      .maybeSingle();

    if (findErr) throw findErr;

    if (!row?.id) {
      return NextResponse.redirect(`${base}/?newsletter=invalid`);
    }

    const { error: upErr } = await supabase
      .from("newsletter_subscribers")
      .update({
        verified_at: new Date().toISOString(),
        verification_token: null,
      })
      .eq("id", row.id);

    if (upErr) throw upErr;

    return NextResponse.redirect(`${base}/?newsletter=verified`);
  } catch {
    return NextResponse.redirect(`${base}/?newsletter=error`);
  }
}
