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
    const { searchParams } = new URL(request.url);
    const shardRaw = searchParams.get("shard");
    const totalRaw = searchParams.get("total");
    const hasShardingParams = shardRaw !== null || totalRaw !== null;
    const shard = shardRaw === null ? 1 : Number.parseInt(shardRaw, 10);
    const total = totalRaw === null ? 1 : Number.parseInt(totalRaw, 10);

    if (
      !Number.isInteger(shard) ||
      !Number.isInteger(total) ||
      total < 1 ||
      shard < 1 ||
      shard > total ||
      (hasShardingParams && (shardRaw === null || totalRaw === null))
    ) {
      return NextResponse.json(
        {
          error:
            "Parámetros inválidos: usa ambos ?shard=1..N&total=N (enteros) o ninguno.",
        },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const result = await runIngest(supabase, {
      shardIndex: shard - 1,
      shardTotal: total,
    });
    return NextResponse.json({
      ...result,
      shard,
      total,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
