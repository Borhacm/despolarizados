import Parser from "rss-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import { factualidadRank } from "@/lib/factualidad";
import { embedOne } from "@/lib/embeddings";
import { getIngestClusterMode } from "@/lib/ingest-mode";
import {
  combinedArticleText,
  parseLexicalThreshold,
  similarityForClustering,
} from "@/lib/title-similarity";
import { cosineSimilarity, mergeEmbeddings, parseVector } from "@/lib/vector";

const SIMILARITY_THRESHOLD = 0.82;
const MAX_ITEMS_PER_FEED = 22;
const MAX_HISTORIAS_COMPARE = 500;
const LOOKBACK_DAYS = 14;

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent": "Despolarizados/0.1 (aggregator)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

export type IngestResult = {
  ok: boolean;
  feedsProcessed: number;
  itemsSeen: number;
  articlesInserted: number;
  skippedDuplicate: number;
  clusterMode: "openai" | "lexical";
  errors: string[];
};

type Medio = {
  id: string;
  nombre: string;
  factualidad: string;
  rss_urls: string[];
};

type PoolOpenAI = { id: string; embedding: number[] | null };
type PoolLexical = {
  id: string;
  titulo_canonico: string;
  resumen_canonico: string | null;
};

function pickTextForEmbedding(title: string, summary: string): string {
  return `${title}\n${summary}`.trim();
}

async function loadHistoriasPoolOpenAI(
  supabase: SupabaseClient,
): Promise<PoolOpenAI[]> {
  const cutoff = Date.now() - LOOKBACK_DAYS * 86400000;
  const { data, error } = await supabase
    .from("historias")
    .select("id, embedding, ultima_pub, created_at")
    .not("embedding", "is", null)
    .order("ultima_pub", { ascending: false, nullsFirst: false })
    .limit(MAX_HISTORIAS_COMPARE);

  if (error) throw error;
  return (data ?? [])
    .filter((h) => {
      const t = h.ultima_pub
        ? new Date(h.ultima_pub as string).getTime()
        : new Date(h.created_at as string).getTime();
      return t >= cutoff;
    })
    .map((h) => ({
      id: h.id as string,
      embedding: parseVector(h.embedding),
    }));
}

async function loadHistoriasPoolLexical(
  supabase: SupabaseClient,
): Promise<PoolLexical[]> {
  const cutoff = Date.now() - LOOKBACK_DAYS * 86400000;
  const { data, error } = await supabase
    .from("historias")
    .select("id, titulo_canonico, resumen_canonico, ultima_pub, created_at")
    .order("ultima_pub", { ascending: false, nullsFirst: false })
    .limit(MAX_HISTORIAS_COMPARE);

  if (error) throw error;
  return (data ?? [])
    .filter((h) => {
      const t = h.ultima_pub
        ? new Date(h.ultima_pub as string).getTime()
        : new Date(h.created_at as string).getTime();
      return t >= cutoff;
    })
    .map((h) => ({
      id: h.id as string,
      titulo_canonico: h.titulo_canonico as string,
      resumen_canonico: (h.resumen_canonico as string | null) ?? null,
    }));
}

function findBestHistoriaOpenAI(
  pool: PoolOpenAI[],
  vec: number[],
): { id: string; score: number } | null {
  let best: { id: string; score: number } | null = null;
  for (const h of pool) {
    if (!h.embedding) continue;
    const score = cosineSimilarity(vec, h.embedding);
    if (score >= SIMILARITY_THRESHOLD && (!best || score > best.score)) {
      best = { id: h.id, score };
    }
  }
  return best;
}

function historiaTextForLexical(h: PoolLexical): string {
  const r = h.resumen_canonico?.replace(/\s+/g, " ").trim().slice(0, 420) ?? "";
  return combinedArticleText(h.titulo_canonico, r);
}

function findBestHistoriaLexical(
  pool: PoolLexical[],
  title: string,
  summary: string,
  threshold: number,
): { id: string; score: number } | null {
  const incoming = combinedArticleText(title, summary);
  let best: { id: string; score: number } | null = null;
  for (const h of pool) {
    const cand = historiaTextForLexical(h);
    const score = similarityForClustering(incoming, cand);
    if (score >= threshold && (!best || score > best.score)) {
      best = { id: h.id, score };
    }
  }
  return best;
}

async function recomputeHistoria(
  supabase: SupabaseClient,
  historiaId: string,
): Promise<void> {
  const { data: arts, error } = await supabase
    .from("articulos")
    .select("id, titulo, resumen, fecha_pub, medio_id")
    .eq("historia_id", historiaId);

  if (error) throw error;
  const rows = arts ?? [];
  const medioIds = [...new Set(rows.map((r) => r.medio_id as string))];
  const dates = rows
    .map((r) => r.fecha_pub)
    .filter(Boolean)
    .sort() as string[];

  const { data: mediosRows, error: mErr } =
    medioIds.length > 0
      ? await supabase
          .from("medios")
          .select("id, factualidad, nombre")
          .in("id", medioIds)
      : { data: [], error: null };

  if (mErr) throw mErr;
  const medioMap = new Map(
    (mediosRows ?? []).map((m) => [m.id as string, m] as const),
  );

  let titulo = "";
  let resumen: string | null = null;
  let bestRank = -1;

  for (const r of rows) {
    const m = medioMap.get(r.medio_id as string);
    const f = m?.factualidad ?? "media";
    const rank = factualidadRank(f);
    if (rank > bestRank) {
      bestRank = rank;
      titulo = r.titulo as string;
      resumen = (r.resumen as string) ?? null;
    }
  }

  const fallbackNow = new Date().toISOString();
  /** Sin fechas en RSS, PostgREST excluye filas con `ultima_pub` null al filtrar por ventana. */
  const primera_pub =
    dates[0] ?? (rows.length > 0 ? fallbackNow : null);
  const ultima_pub =
    dates[dates.length - 1] ?? (rows.length > 0 ? fallbackNow : null);
  const article_count = rows.length;
  const medio_count = new Set(medioIds).size;
  const importancia = article_count * 10 + medio_count * 12;

  await supabase
    .from("historias")
    .update({
      titulo_canonico: titulo || "Sin título",
      resumen_canonico: resumen,
      primera_pub,
      ultima_pub,
      article_count,
      medio_count,
      importancia,
      updated_at: new Date().toISOString(),
    })
    .eq("id", historiaId);
}

export async function runIngest(
  supabase: SupabaseClient,
): Promise<IngestResult> {
  const errors: string[] = [];
  let feedsProcessed = 0;
  let itemsSeen = 0;
  let articlesInserted = 0;
  let skippedDuplicate = 0;

  const clusterMode = getIngestClusterMode();
  const lexicalThreshold = parseLexicalThreshold();

  const { data: medios, error: mediosErr } = await supabase
    .from("medios")
    .select("id, nombre, factualidad, rss_urls")
    .eq("active", true)
    .order("prioridad", { ascending: false });

  if (mediosErr) throw mediosErr;
  const list = (medios ?? []) as Medio[];

  let poolOpenAI: PoolOpenAI[] =
    clusterMode === "openai" ? await loadHistoriasPoolOpenAI(supabase) : [];
  let poolLexical: PoolLexical[] =
    clusterMode === "lexical" ? await loadHistoriasPoolLexical(supabase) : [];

  for (const medio of list) {
    for (const feedUrl of medio.rss_urls) {
      feedsProcessed += 1;
      try {
        const feed = await parser.parseURL(feedUrl);
        const items = (feed.items ?? []).slice(0, MAX_ITEMS_PER_FEED);
        for (const item of items) {
          itemsSeen += 1;
          const url = item.link?.trim();
          const title = (item.title ?? "").trim();
          if (!url || !title) continue;

          const { data: exists } = await supabase
            .from("articulos")
            .select("id")
            .eq("url", url)
            .maybeSingle();
          if (exists) {
            skippedDuplicate += 1;
            continue;
          }

          const summary = (
            item.contentSnippet ??
            item.summary ??
            item.content ??
            ""
          )
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1200);

          let imagen: string | null = null;
          const it = item as Record<string, unknown>;
          const enclosure = it.enclosure as { url?: string } | undefined;
          if (enclosure?.url) imagen = enclosure.url;
          const media = it["media:content"] as { $?: { url?: string } } | undefined;
          if (media?.$?.url) imagen = media.$.url;

          const fechaRaw = item.isoDate ?? item.pubDate;
          const fecha_pub = fechaRaw ? new Date(fechaRaw).toISOString() : null;

          const vecText = pickTextForEmbedding(title, summary);
          const now = new Date().toISOString();

          if (clusterMode === "openai") {
            const embedding = await embedOne(vecText);
            const match = findBestHistoriaOpenAI(poolOpenAI, embedding);

            if (match) {
              const { data: h, error: hErr } = await supabase
                .from("historias")
                .select("id, embedding, article_count")
                .eq("id", match.id)
                .single();
              if (hErr) throw hErr;

              const oldEmb = parseVector(h.embedding);
              const n = (h.article_count as number) ?? 0;
              const merged = mergeEmbeddings(oldEmb, n, embedding);

              const { error: upErr } = await supabase
                .from("historias")
                .update({
                  embedding: merged,
                  ultima_pub: fecha_pub ?? now,
                  updated_at: now,
                })
                .eq("id", match.id);
              if (upErr) throw upErr;

              const { error: insErr } = await supabase.from("articulos").insert({
                historia_id: match.id,
                medio_id: medio.id,
                titulo: title,
                resumen: summary || null,
                url,
                fecha_pub,
                imagen_url: imagen,
                embedding,
              });
              if (insErr) throw insErr;

              await recomputeHistoria(supabase, match.id);
              articlesInserted += 1;
              poolOpenAI = await loadHistoriasPoolOpenAI(supabase);
            } else {
              const { data: hNew, error: insHErr } = await supabase
                .from("historias")
                .insert({
                  titulo_canonico: title,
                  resumen_canonico: summary || null,
                  embedding,
                  importancia: 0,
                  primera_pub: fecha_pub ?? now,
                  ultima_pub: fecha_pub ?? now,
                  article_count: 0,
                  medio_count: 0,
                })
                .select("id")
                .single();
              if (insHErr) throw insHErr;

              const hid = hNew!.id as string;
              const { error: insAErr } = await supabase.from("articulos").insert({
                historia_id: hid,
                medio_id: medio.id,
                titulo: title,
                resumen: summary || null,
                url,
                fecha_pub,
                imagen_url: imagen,
                embedding,
              });
              if (insAErr) throw insAErr;

              await recomputeHistoria(supabase, hid);
              articlesInserted += 1;
              poolOpenAI = await loadHistoriasPoolOpenAI(supabase);
            }
          } else {
            const match = findBestHistoriaLexical(
              poolLexical,
              title,
              summary,
              lexicalThreshold,
            );

            if (match) {
              const { error: upErr } = await supabase
                .from("historias")
                .update({
                  ultima_pub: fecha_pub ?? now,
                  updated_at: now,
                })
                .eq("id", match.id);
              if (upErr) throw upErr;

              const { error: insErr } = await supabase.from("articulos").insert({
                historia_id: match.id,
                medio_id: medio.id,
                titulo: title,
                resumen: summary || null,
                url,
                fecha_pub,
                imagen_url: imagen,
                embedding: null,
              });
              if (insErr) throw insErr;

              await recomputeHistoria(supabase, match.id);
              articlesInserted += 1;
              poolLexical = await loadHistoriasPoolLexical(supabase);
            } else {
              const { data: hNew, error: insHErr } = await supabase
                .from("historias")
                .insert({
                  titulo_canonico: title,
                  resumen_canonico: summary || null,
                  embedding: null,
                  importancia: 0,
                  primera_pub: fecha_pub ?? now,
                  ultima_pub: fecha_pub ?? now,
                  article_count: 0,
                  medio_count: 0,
                })
                .select("id")
                .single();
              if (insHErr) throw insHErr;

              const hid = hNew!.id as string;
              const { error: insAErr } = await supabase.from("articulos").insert({
                historia_id: hid,
                medio_id: medio.id,
                titulo: title,
                resumen: summary || null,
                url,
                fecha_pub,
                imagen_url: imagen,
                embedding: null,
              });
              if (insAErr) throw insAErr;

              await recomputeHistoria(supabase, hid);
              articlesInserted += 1;
              poolLexical = await loadHistoriasPoolLexical(supabase);
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${medio.nombre} (${feedUrl}): ${msg}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    feedsProcessed,
    itemsSeen,
    articlesInserted,
    skippedDuplicate,
    clusterMode,
    errors,
  };
}
