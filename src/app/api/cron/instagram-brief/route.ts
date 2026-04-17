import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  buildInstagramBrief,
  buildInstagramBriefCaption,
} from "@/lib/instagram-brief";
import {
  isInstagramGraphConfigured,
  publishInstagramImagePost,
} from "@/lib/instagram-graph";
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

  if (!isInstagramGraphConfigured()) {
    return NextResponse.json(
      {
        error:
          "Faltan variables IG_GRAPH_ACCESS_TOKEN o IG_GRAPH_USER_ID para publicar en Instagram.",
      },
      { status: 500 },
    );
  }

  try {
    const supabase = createServiceClient();
    const baseUrl = getAppBaseUrl();
    const blocks = await buildInstagramBrief({
      supabase,
      storyBaseUrl: baseUrl,
    });
    const caption = buildInstagramBriefCaption(blocks);

    const selectedImage = blocks.find((b) => b.imageUrl)?.imageUrl;
    if (!selectedImage) {
      return NextResponse.json(
        { error: "No hay imagen disponible para publicar en Instagram." },
        { status: 500 },
      );
    }

    const dryRun =
      new URL(request.url).searchParams.get("dryRun") === "1" ||
      new URL(request.url).searchParams.get("dryRun") === "true";

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        imageUrl: selectedImage,
        caption,
        blocks,
      });
    }

    const publish = await publishInstagramImagePost({
      imageUrl: selectedImage,
      caption,
    });

    if (!publish.ok) {
      return NextResponse.json({ error: publish.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      mediaId: publish.mediaId,
      imageUrl: selectedImage,
      blocks,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
