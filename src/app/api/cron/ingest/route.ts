import { ingestRequiresOpenAI } from "@/lib/ingest-mode";
import { runIngest } from "@/lib/ingest";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (ingestRequiresOpenAI() && !process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Modo openai: falta OPENAI_API_KEY (o usa INGEST_CLUSTER_MODE=lexical)." },
      { status: 500 },
    );
  }

  try {
    const supabase = createServiceClient();
    const result = await runIngest(supabase);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
