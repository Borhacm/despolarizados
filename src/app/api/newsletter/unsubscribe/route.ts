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
    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("unsubscribe_token", token);

    if (error) throw error;

    return NextResponse.redirect(`${base}/?newsletter=unsubscribed`);
  } catch {
    return NextResponse.redirect(`${base}/?newsletter=error`);
  }
}
