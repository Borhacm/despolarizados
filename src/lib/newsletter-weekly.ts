import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchBlindspotHistorias } from "@/lib/blindspot-historias";
import { fetchCoverageMixByHistoriaIds, type CoverageMix } from "@/lib/coverage-mix";
import { fetchCoverImagesByHistoriaIds } from "@/lib/historia-covers";
import { buildHistoriaUrl } from "@/lib/newsletter-resend";
import { snippet } from "@/lib/snippet";

export type EditionItem = {
  id: string;
  titulo: string;
  resumen: string | null;
  url: string;
  imageUrl: string | null;
  medioCount: number;
  articleCount: number;
  coverageMix: CoverageMix | null;
};

export type WeeklyEdition = {
  top: EditionItem[];
  /** Historias que la izquierda apenas cubrió. */
  sinIzquierda: EditionItem[];
  /** Historias que la derecha apenas cubrió. */
  sinDerecha: EditionItem[];
};

const TOP_WEEKLY = 8;
const TOP_DAILY = 10;
const BLINDSPOTS_PER_SIDE = 3;

type Row = {
  id: string;
  titulo_canonico: string;
  resumen_canonico: string | null;
  medio_count: number;
  article_count: number;
};

async function toItems(supabase: SupabaseClient, rows: Row[]): Promise<EditionItem[]> {
  const ids = rows.map((r) => r.id);
  const [mixes, covers] = await Promise.all([
    fetchCoverageMixByHistoriaIds(supabase, ids),
    fetchCoverImagesByHistoriaIds(supabase, ids),
  ]);
  return rows.map((r) => ({
    id: r.id,
    titulo: r.titulo_canonico,
    resumen: r.resumen_canonico ? snippet(r.resumen_canonico) : null,
    url: buildHistoriaUrl(r.id),
    imageUrl: covers.get(r.id) ?? null,
    medioCount: r.medio_count,
    articleCount: r.article_count,
    coverageMix: mixes.get(r.id) ?? null,
  }));
}

/** Historias plurales con actividad desde `sinceIso`, por importancia. */
async function topPlural(
  supabase: SupabaseClient,
  sinceIso: string,
  minMedios: number,
  limit: number,
): Promise<EditionItem[]> {
  const { data, error } = await supabase
    .from("historias")
    .select("id, titulo_canonico, resumen_canonico, medio_count, article_count")
    .gte("ultima_pub", sinceIso)
    .gte("medio_count", minMedios)
    .order("importancia", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return toItems(supabase, (data ?? []) as Row[]);
}

/**
 * Edición semanal: lo más cubierto de los últimos 7 días y el ángulo muerto de cada lado
 * (mismo criterio que /angulo-muerto). Sin historias de un solo medio: no hay nada que
 * comparar.
 */
export async function fetchWeeklyEdition(supabase: SupabaseClient): Promise<WeeklyEdition> {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [top, blind] = await Promise.all([
    topPlural(supabase, since, 3, TOP_WEEKLY),
    fetchBlindspotHistorias(supabase, { limit: 40 }),
  ]);
  const topIds = new Set(top.map((t) => t.id));
  const pick = (side: "izquierda" | "derecha") =>
    blind
      .filter((b) => b.missingSide === side && !topIds.has(b.id))
      .slice(0, BLINDSPOTS_PER_SIDE)
      .map((b) => ({
        id: b.id,
        titulo_canonico: b.titulo_canonico,
        resumen_canonico: b.resumen_canonico,
        medio_count: b.medio_count,
        article_count: b.article_count,
      }));
  const [sinIzquierda, sinDerecha] = await Promise.all([
    toItems(supabase, pick("izquierda")),
    toItems(supabase, pick("derecha")),
  ]);
  return { top, sinIzquierda, sinDerecha };
}

/** Edición diaria: historias plurales (2+ medios) con actividad desde el último envío. */
export async function fetchDailyEdition(
  supabase: SupabaseClient,
  sinceIso: string,
): Promise<EditionItem[]> {
  return topPlural(supabase, sinceIso, 2, TOP_DAILY);
}
