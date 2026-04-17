import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchCoverageMixByHistoriaIds,
  type CoverageMix,
} from "@/lib/coverage-mix";
import { fetchCoverImagesByHistoriaIds } from "@/lib/historia-covers";
import type { HistoriaRow } from "@/lib/types";

const DOMINANT_MIN = 68;
const MAX_TITLE = 120;

type Side = "izquierda" | "centro" | "derecha";

type StoryWithMix = HistoriaRow & {
  coverageMix: CoverageMix;
};

export type InstagramBriefBlock = {
  side: Side;
  badge: "ANGULO MUERTO" | "SESGO";
  dominantPct: number;
  historiaId: string;
  titulo: string;
  url: string;
  imageUrl: string | null;
  mix: CoverageMix;
};

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

  const pickOne = (side: Side, used: Set<string>): StoryWithMix | null => {
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

  const sides: Side[] = ["izquierda", "centro", "derecha"];
  const used = new Set<string>();
  const chosen: { side: Side; row: StoryWithMix }[] = [];
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
    return {
      side,
      badge: dominantPct >= DOMINANT_MIN ? "ANGULO MUERTO" : "SESGO",
      dominantPct,
      historiaId: row.id,
      titulo: row.titulo_canonico,
      url: `${params.storyBaseUrl}/historia/${row.id}`,
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

function sideLabel(side: Side): string {
  if (side === "izquierda") return "IZQUIERDA";
  if (side === "derecha") return "DERECHA";
  return "CENTRO";
}

export function buildInstagramBriefCaption(blocks: InstagramBriefBlock[]): string {
  const lines = blocks.map((b) => {
    return [
      `${b.badge} · ${sideLabel(b.side)}`,
      `${shortTitle(b.titulo)}`,
      `Cobertura: Izq ${b.mix.izqPct}% | Centro ${b.mix.centroPct}% | Der ${b.mix.derPct}%`,
      b.url,
    ].join("\n");
  });

  return [
    "Resumen automatico del dia (3 bloques):",
    "",
    ...lines.flatMap((l, i) => (i === 0 ? [l] : ["", l])),
    "",
    "#despolarizados #anguloMuerto #sesgo #medios #noticias",
  ].join("\n");
}
