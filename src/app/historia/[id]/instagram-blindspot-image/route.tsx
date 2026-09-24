import { ImageResponse } from "next/og";
import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  badgeForBloqueSide,
  blindspotClaimFromMix,
  type InstagramBloqueSide,
} from "@/lib/instagram-brief";
import {
  InstagramBlindspotLayout,
  INSTAGRAM_FEED_SIZE,
  loadHistoriaShareImageData,
} from "@/lib/og/historia-share-image";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

function parseBloque(raw: string | null): InstagramBloqueSide {
  if (raw === "izquierda" || raw === "centro" || raw === "derecha") return raw;
  return "centro";
}

/**
 * PNG 4:5 para carrusel de Instagram: claim, foto, barra, titular y enlaces.
 * Query: `?bloque=izquierda|centro|derecha` (alineado con el cron de 3 bloques).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const bloque = parseBloque(new URL(request.url).searchParams.get("bloque"));

  const supabase = createPublicClient();
  const { data, coverDataUrl } = await loadHistoriaShareImageData(
    supabase,
    id,
  );

  const appBaseUrl = getAppBaseUrl().replace(/\/$/, "");
  const historiaUrl = `${appBaseUrl}/historia/${id}`;

  const mix = data?.mix ?? null;
  const claim = mix
    ? blindspotClaimFromMix(mix)
    : "Cobertura por orientación: comparativa en Despolarizados.";
  const badge = mix
    ? badgeForBloqueSide(mix, bloque)
    : "SESGO";

  const bloqueLabel =
    bloque === "izquierda"
      ? "IZQUIERDA"
      : bloque === "derecha"
        ? "DERECHA"
        : "CENTRO";

  return new ImageResponse(
    <InstagramBlindspotLayout
      data={data}
      coverDataUrl={coverDataUrl}
      claim={claim}
      badge={badge}
      bloqueLabel={bloqueLabel}
      appBaseUrl={appBaseUrl}
      historiaUrl={historiaUrl}
    />,
    { ...INSTAGRAM_FEED_SIZE },
  );
}
