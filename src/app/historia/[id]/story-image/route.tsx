import { ImageResponse } from "next/og";
import {
  HistoriaShareStoryLayout,
  loadHistoriaShareImageData,
  STORY_SIZE,
} from "@/lib/og/historia-share-image";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

/**
 * PNG 9:16 para Instagram Stories y flujos “tipo Spotify” (imagen + enlace en leyenda).
 * No sustituye a opengraph-image (1.91:1) usado por crawlers.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = createPublicClient();
  const { data, coverDataUrl, host } = await loadHistoriaShareImageData(
    supabase,
    id,
  );

  return new ImageResponse(
    <HistoriaShareStoryLayout
      data={data}
      coverDataUrl={coverDataUrl}
      host={host}
    />,
    { ...STORY_SIZE },
  );
}
