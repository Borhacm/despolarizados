import { ImageResponse } from "next/og";
import {
  HistoriaShareOgLayout,
  loadHistoriaShareImageData,
  OG_SIZE,
} from "@/lib/og/historia-share-image";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

export const alt = "Despolarizados — Comparativa de medios";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data, coverDataUrl, host } = await loadHistoriaShareImageData(
    supabase,
    id,
  );

  return new ImageResponse(
    <HistoriaShareOgLayout data={data} coverDataUrl={coverDataUrl} host={host} />,
    { ...OG_SIZE },
  );
}
