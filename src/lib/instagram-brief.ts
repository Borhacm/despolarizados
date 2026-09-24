import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchCoverageMixByHistoriaIds,
  type CoverageMix,
} from "@/lib/coverage-mix";
import { fetchCoverImagesByHistoriaIds } from "@/lib/historia-covers";
import type { HistoriaRow } from "@/lib/types";

export const INSTAGRAM_DOMINANT_MIN = 68;
const MAX_TITLE = 120;

export type InstagramBloqueSide = "izquierda" | "centro" | "derecha";

type StoryWithMix = HistoriaRow & {
  coverageMix: CoverageMix;
};

export type InstagramBriefBlock = {
  side: InstagramBloqueSide;
  badge: "ANGULO MUERTO" | "SESGO";
  dominantPct: number;
  historiaId: string;
  titulo: string;
  url: string;
  /** URL pública de la imagen renderizada (OG) para Graph API */
  renderedImageUrl: string;
  imageUrl: string | null;
  mix: CoverageMix;
};

/**
 * Texto tipo "para quién" según dónde se concentra la cobertura (misma lógica que /angulo-muerto).
 */
/** Misma regla que el cron: umbral sobre el % del bloque (izq/centro/der). */
export function badgeForBloqueSide(
  mix: CoverageMix,
  side: InstagramBloqueSide,
): "ANGULO MUERTO" | "SESGO" {
  const dominantPct =
    side === "izquierda"
      ? mix.izqPct
      : side === "derecha"
        ? mix.derPct
        : mix.centroPct;
  return dominantPct >= INSTAGRAM_DOMINANT_MIN ? "ANGULO MUERTO" : "SESGO";
}

export function blindspotClaimFromMix(mix: CoverageMix): string {
  const maxPct = Math.max(mix.izqPct, mix.centroPct, mix.derPct);
  let skew: "izquierda" | "centro" | "derecha" = "centro";
  if (mix.izqPct === maxPct) skew = "izquierda";
  else if (mix.derPct === maxPct) skew = "derecha";

  if (skew === "izquierda") {
    return "Ángulo muerto para quien busca más perspectiva desde la derecha.";
  }
  if (skew === "derecha") {
    return "Ángulo muerto para quien busca más perspectiva desde la izquierda.";
  }
  return "Ángulo muerto para quien busca lecturas fuera del centro.";
}

export async function buildInstagramBrief(params: {
  supabase: SupabaseClient;
  storyBaseUrl: string;
  pool?: number;
}): Promise<InstagramBriefBlock[]> {
  const pool = params.pool ?? 150;
  const { data, error } = await params.supabase
    .from("historias")
    .select("*")
    .gte("medio_count", 2)
    .order("importancia", { ascending: false })
    .limit(pool);

  if (error) throw error;
  const rows = (data ?? []) as HistoriaRow[];
  if (rows.length === 0) {
    throw new Error("No hay historias para armar el resumen de Instagram.");
  }

  const mixes = await fetchCoverageMixByHistoriaIds(
    params.supabase,
    rows.map((r) => r.id),
  );
  const rowsWithMix: StoryWithMix[] = rows
    .map((r) => {
      const coverageMix = mixes.get(r.id);
      if (!coverageMix) return null;
      return { ...r, coverageMix };
    })
    .filter((r): r is StoryWithMix => Boolean(r));

  const pickOne = (
    side: InstagramBloqueSide,
    used: Set<string>,
  ): StoryWithMix | null => {
    let best: StoryWithMix | null = null;
    let bestScore = -1;
    for (const row of rowsWithMix) {
      if (used.has(row.id)) continue;
      const score =
        side === "izquierda"
          ? row.coverageMix.izqPct
          : side === "derecha"
            ? row.coverageMix.derPct
            : row.coverageMix.centroPct;
      if (score > bestScore) {
        best = row;
        bestScore = score;
      }
    }
    return best;
  };

  const sides: InstagramBloqueSide[] = ["izquierda", "centro", "derecha"];
  const used = new Set<string>();
  const chosen: { side: InstagramBloqueSide; row: StoryWithMix }[] = [];
  for (const side of sides) {
    const row = pickOne(side, used);
    if (!row) throw new Error(`No se encontró historia para ${side}.`);
    chosen.push({ side, row });
    used.add(row.id);
  }

  const imageMap = await fetchCoverImagesByHistoriaIds(
    params.supabase,
    chosen.map((c) => c.row.id),
  );

  return chosen.map(({ side, row }) => {
    const dominantPct =
      side === "izquierda"
        ? row.coverageMix.izqPct
        : side === "derecha"
          ? row.coverageMix.derPct
          : row.coverageMix.centroPct;
    const q = new URLSearchParams({ bloque: side });
    const renderedImageUrl = `${params.storyBaseUrl}/historia/${row.id}/instagram-blindspot-image?${q.toString()}`;
    return {
      side,
      badge:
        dominantPct >= INSTAGRAM_DOMINANT_MIN ? "ANGULO MUERTO" : "SESGO",
      dominantPct,
      historiaId: row.id,
      titulo: row.titulo_canonico,
      url: `${params.storyBaseUrl}/historia/${row.id}`,
      renderedImageUrl,
      imageUrl: imageMap.get(row.id) ?? null,
      mix: row.coverageMix,
    };
  });
}

function shortTitle(input: string): string {
  const clean = input.trim().replace(/\s+/g, " ");
  if (clean.length <= MAX_TITLE) return clean;
  return `${clean.slice(0, MAX_TITLE - 1).trimEnd()}...`;
}

function sideLabel(side: InstagramBloqueSide): string {
  if (side === "izquierda") return "IZQUIERDA";
  if (side === "derecha") return "DERECHA";
  return "CENTRO";
}

export function buildInstagramBriefCaption(blocks: InstagramBriefBlock[]): string {
  let appBase = "";
  try {
    if (blocks[0]?.url) appBase = new URL(blocks[0].url).origin;
  } catch {
    /* ignore */
  }
  const lines = blocks.map((b) => {
    return [
      `${b.badge} · ${sideLabel(b.side)}`,
      shortTitle(b.titulo),
      b.url,
    ].join("\n");
  });

  return [
    "Tres lecturas del día: izquierda · centro · derecha.",
    "Cada slide: claim de ángulo muerto, imagen, barra de ideología y titular.",
    "",
    ...lines.flatMap((l, i) => (i === 0 ? [l] : ["", l])),
    "",
    appBase ? `Despolarizados: ${appBase}` : "",
    "",
    "#despolarizados #anguloMuerto #sesgo #medios #noticias",
  ]
    .filter(Boolean)
    .join("\n");
}
