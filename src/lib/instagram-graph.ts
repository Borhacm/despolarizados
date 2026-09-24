const GRAPH_BASE = "https://graph.facebook.com/v23.0";

export function isInstagramGraphConfigured(): boolean {
  return Boolean(
    process.env.IG_GRAPH_ACCESS_TOKEN?.trim() &&
      process.env.IG_GRAPH_USER_ID?.trim(),
  );
}

function getInstagramGraphConfig(): {
  accessToken: string;
  userId: string;
} {
  const accessToken = process.env.IG_GRAPH_ACCESS_TOKEN?.trim();
  const userId = process.env.IG_GRAPH_USER_ID?.trim();
  if (!accessToken || !userId) {
    throw new Error(
      "Faltan IG_GRAPH_ACCESS_TOKEN o IG_GRAPH_USER_ID para publicar en Instagram.",
    );
  }
  return { accessToken, userId };
}

type PublishImagePostParams = {
  imageUrl: string;
  caption: string;
};

export async function publishInstagramImagePost(
  params: PublishImagePostParams,
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  try {
    const { accessToken, userId } = getInstagramGraphConfig();

    const containerRes = await fetch(`${GRAPH_BASE}/${userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: params.imageUrl,
        caption: params.caption,
        access_token: accessToken,
      }),
    });

    if (!containerRes.ok) {
      const text = await containerRes.text().catch(() => "");
      return {
        ok: false,
        error: text || `Graph media create HTTP ${containerRes.status}`,
      };
    }

    const containerJson = (await containerRes.json()) as { id?: string };
    const creationId = containerJson.id?.trim();
    if (!creationId) {
      return {
        ok: false,
        error: "Graph API no devolvió creation_id al crear el contenedor.",
      };
    }

    const publishRes = await fetch(`${GRAPH_BASE}/${userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    if (!publishRes.ok) {
      const text = await publishRes.text().catch(() => "");
      return {
        ok: false,
        error: text || `Graph media publish HTTP ${publishRes.status}`,
      };
    }

    const publishJson = (await publishRes.json()) as { id?: string };
    const mediaId = publishJson.id?.trim();
    if (!mediaId) {
      return {
        ok: false,
        error: "Graph API no devolvió media_id tras publicar.",
      };
    }

    return { ok: true, mediaId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

type PublishCarouselParams = {
  imageUrls: string[];
  caption: string;
};

/**
 * Publica un carrusel (2–10 imágenes). Cada URL debe ser pública (JPG/PNG).
 * @see https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */
export async function publishInstagramCarouselPost(
  params: PublishCarouselParams,
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  if (params.imageUrls.length < 2 || params.imageUrls.length > 10) {
    return {
      ok: false,
      error: "El carrusel requiere entre 2 y 10 imágenes.",
    };
  }

  try {
    const { accessToken, userId } = getInstagramGraphConfig();
    const childIds: string[] = [];

    for (const imageUrl of params.imageUrls) {
      const childRes = await fetch(`${GRAPH_BASE}/${userId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          is_carousel_item: true,
          access_token: accessToken,
        }),
      });
      if (!childRes.ok) {
        const text = await childRes.text().catch(() => "");
        return {
          ok: false,
          error: text || `Graph carousel child HTTP ${childRes.status}`,
        };
      }
      const childJson = (await childRes.json()) as { id?: string };
      const cid = childJson.id?.trim();
      if (!cid) {
        return {
          ok: false,
          error: "Graph API no devolvió id de item de carrusel.",
        };
      }
      childIds.push(cid);
    }

    const carouselRes = await fetch(`${GRAPH_BASE}/${userId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption: params.caption,
        access_token: accessToken,
      }),
    });

    if (!carouselRes.ok) {
      const text = await carouselRes.text().catch(() => "");
      return {
        ok: false,
        error: text || `Graph carousel container HTTP ${carouselRes.status}`,
      };
    }

    const carouselJson = (await carouselRes.json()) as { id?: string };
    const creationId = carouselJson.id?.trim();
    if (!creationId) {
      return {
        ok: false,
        error: "Graph API no devolvió creation_id del carrusel.",
      };
    }

    const publishRes = await fetch(`${GRAPH_BASE}/${userId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    if (!publishRes.ok) {
      const text = await publishRes.text().catch(() => "");
      return {
        ok: false,
        error: text || `Graph carousel publish HTTP ${publishRes.status}`,
      };
    }

    const publishJson = (await publishRes.json()) as { id?: string };
    const mediaId = publishJson.id?.trim();
    if (!mediaId) {
      return {
        ok: false,
        error: "Graph API no devolvió media_id tras publicar el carrusel.",
      };
    }

    return { ok: true, mediaId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
