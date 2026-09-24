import Parser from "rss-parser";
import type { Item } from "rss-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recomputeHistoria } from "@/lib/historia-recompute";
import { embedOne } from "@/lib/embeddings";
import { getIngestClusterMode } from "@/lib/ingest-mode";
import { shouldExcludeLowValueNews } from "@/lib/ingest-relevance";
import { lexicalClusteringScore, parseLexicalThreshold } from "@/lib/title-similarity";
import { cosineSimilarity, mergeEmbeddings, parseVector } from "@/lib/vector";

/** Umbral coseno embedding vs. historia; por defecto igual que antes (0.82). */
function embeddingMatchThreshold(): number {
  const raw = process.env.INGEST_EMBEDDING_THRESHOLD?.trim();
  if (!raw) return 0.82;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 1) return 0.82;
  return n;
}
const MAX_ITEMS_PER_FEED = 40;
const MAX_HISTORIAS_COMPARE = 800;
/** Historias candidatas: solo las activas en los últimos días. */
const LOOKBACK_DAYS = 4;
/** Un artículo solo se agrupa con historias publicadas dentro de esta ventana. */
const CLUSTER_WINDOW_HOURS = 72;
/** Evita que un medio que repite formato acapare una historia. */
const MAX_ARTICLES_PER_MEDIO_PER_HISTORIA = 2;
const FEED_FETCH_CONCURRENCY = 8;
const RSS_PARSER_TIMEOUT_MS = 10000;
const FETCH_TIMEOUT_MS = 10000;
const DEFAULT_INGEST_TIME_BUDGET_MS = 240000;
const INGEST_TIME_SAFETY_MARGIN_MS = 5000;

const INGEST_USER_AGENT =
  "Mozilla/5.0 (compatible; Despolarizados/1.0; +https://despolarizados.bocal.online)";

const parser = new Parser({
  timeout: RSS_PARSER_TIMEOUT_MS,
  headers: {
    "User-Agent": INGEST_USER_AGENT,
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

/** WordPress REST: mismo sitio desactivó RSS pero expone `/wp-json/wp/v2/posts`. */
function isWordPressRestPostsUrl(url: string): boolean {
  return url.includes("/wp-json/wp/v2/posts");
}

function stripHtmlToText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type WpRestPost = {
  link?: string;
  date?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
};

async function loadFeedItems(feedUrl: string): Promise<Item[]> {
  if (isWordPressRestPostsUrl(feedUrl)) {
    const res = await fetch(feedUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": INGEST_USER_AGENT,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new Error("Respuesta WP-JSON inesperada (no es un array)");
    }
    const out: Item[] = [];
    for (const row of data as WpRestPost[]) {
      const link = row.link?.trim();
      const titleHtml = row.title?.rendered ?? "";
      const title = stripHtmlToText(titleHtml);
      if (!link || !title) continue;
      const summary = stripHtmlToText(row.excerpt?.rendered ?? "");
      const iso =
        row.date && !Number.isNaN(Date.parse(row.date))
          ? new Date(row.date).toISOString()
          : undefined;
      out.push({
        title,
        link,
        contentSnippet: summary,
        isoDate: iso,
      });
    }
    return out;
  }

  const feed = await parser.parseURL(feedUrl);
  return feed.items ?? [];
}

export type IngestResult = {
  ok: boolean;
  timedOutEarly: boolean;
  timeBudgetMs: number;
  feedsScheduled: number;
  feedsProcessed: number;
  itemsSeen: number;
  itemsExcludedLowValue: number;
  articlesInserted: number;
  skippedDuplicate: number;
  clusterMode: "openai" | "lexical";
  errors: string[];
};

export type IngestOptions = {
  shardIndex?: number;
  shardTotal?: number;
};

type Medio = {
  id: string;
  nombre: string;
  factualidad: string;
  rss_urls: string[];
};

function parseIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function ingestTimeBudgetMs(): number {
  return parseIntEnv("INGEST_TIME_BUDGET_MS", DEFAULT_INGEST_TIME_BUDGET_MS, 30000, 295000);
}

function normalizeShard(totalRaw: number | undefined, indexRaw: number | undefined): {
  total: number;
  index: number;
} {
  const total =
    typeof totalRaw === "number" && Number.isInteger(totalRaw) && totalRaw >= 1
      ? totalRaw
      : 1;
  const index =
    typeof indexRaw === "number" &&
    Number.isInteger(indexRaw) &&
    indexRaw >= 0 &&
    indexRaw < total
      ? indexRaw
      : 0;
  return { total, index };
}

function pickShardFeeds<T>(allFeeds: T[], total: number, index: number): T[] {
  if (total <= 1) return allFeeds;
  return allFeeds.filter((_, feedIndex) => feedIndex % total === index);
}

function pickTextForEmbedding(title: string, summary: string): string {
  return `${title}\n${summary}`.trim();
}

/**
 * Historia candidata en memoria. Se carga una vez por ejecución y se actualiza tras cada
 * inserción: antes se releía el pool completo de la base de datos después de cada artículo,
 * lo que agotaba el tiempo de la función y dejaba sin procesar los feeds del final.
 */
type PoolEntry = {
  id: string;
  titulo_canonico: string;
  resumen_canonico: string | null;
  embedding: number[] | null;
  articleCount: number;
  ultimaPubMs: number;
  /** Artículos por medio en esta historia (para limitar cuántos aporta cada medio). */
  porMedio: Map<string, number>;
};

async function loadHistoriasPool(
  supabase: SupabaseClient,
  withEmbeddings: boolean,
): Promise<PoolEntry[]> {
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();
  const cols = withEmbeddings
    ? "id, titulo_canonico, resumen_canonico, embedding, article_count, ultima_pub, created_at"
    : "id, titulo_canonico, resumen_canonico, article_count, ultima_pub, created_at";
  const { data, error } = await supabase
    .from("historias")
    .select(cols)
    .gte("ultima_pub", cutoff)
    .order("ultima_pub", { ascending: false, nullsFirst: false })
    .limit(MAX_HISTORIAS_COMPARE);
  if (error) throw error;

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const pool: PoolEntry[] = rows.map((h) => ({
    id: h.id as string,
    titulo_canonico: h.titulo_canonico as string,
    resumen_canonico: (h.resumen_canonico as string | null) ?? null,
    embedding: withEmbeddings ? parseVector(h.embedding) : null,
    articleCount: (h.article_count as number) ?? 0,
    ultimaPubMs: new Date((h.ultima_pub ?? h.created_at) as string).getTime(),
    porMedio: new Map(),
  }));

  const byId = new Map(pool.map((p) => [p.id, p]));
  const ids = pool.map((p) => p.id);
  for (let i = 0; i < ids.length; i += 150) {
    const { data: arts, error: aErr } = await supabase
      .from("articulos")
      .select("historia_id, medio_id")
      .in("historia_id", ids.slice(i, i + 150));
    if (aErr) throw aErr;
    for (const a of arts ?? []) {
      const entry = byId.get(a.historia_id as string);
      if (!entry) continue;
      const mid = a.medio_id as string;
      entry.porMedio.set(mid, (entry.porMedio.get(mid) ?? 0) + 1);
    }
  }
  return pool;
}

/** Una historia solo admite artículos cercanos en el tiempo y pocos por medio. */
function isEligible(h: PoolEntry, medioId: string, pubMs: number): boolean {
  if (Math.abs(pubMs - h.ultimaPubMs) > CLUSTER_WINDOW_HOURS * 3600000) return false;
  return (h.porMedio.get(medioId) ?? 0) < MAX_ARTICLES_PER_MEDIO_PER_HISTORIA;
}

function findBestHistoriaOpenAI(
  pool: PoolEntry[],
  vec: number[],
  medioId: string,
  pubMs: number,
): { id: string; score: number } | null {
  const t = embeddingMatchThreshold();
  let best: { id: string; score: number } | null = null;
  for (const h of pool) {
    if (!h.embedding || !isEligible(h, medioId, pubMs)) continue;
    const score = cosineSimilarity(vec, h.embedding);
    if (score >= t && (!best || score > best.score)) {
      best = { id: h.id, score };
    }
  }
  return best;
}

function findBestHistoriaLexical(
  pool: PoolEntry[],
  title: string,
  summary: string,
  threshold: number,
  medioId: string,
  pubMs: number,
): { id: string; score: number } | null {
  let best: { id: string; score: number } | null = null;
  for (const h of pool) {
    if (!isEligible(h, medioId, pubMs)) continue;
    const score = lexicalClusteringScore(
      title,
      summary,
      h.titulo_canonico,
      h.resumen_canonico,
    );
    if (score >= threshold && (!best || score > best.score)) {
      best = { id: h.id, score };
    }
  }
  return best;
}

/** Descarga feeds con concurrencia limitada; el procesado posterior es secuencial. */
async function fetchFeedsConcurrently<T extends { feedUrl: string }>(
  feeds: T[],
  deadlineMs: number,
): Promise<{ feed: T; items: Item[] | null; error: string | null }[]> {
  const out: { feed: T; items: Item[] | null; error: string | null }[] = new Array(feeds.length);
  let next = 0;
  async function worker() {
    while (next < feeds.length) {
      const i = next++;
      const feed = feeds[i]!;
      if (Date.now() >= deadlineMs - INGEST_TIME_SAFETY_MARGIN_MS) {
        out[i] = { feed, items: null, error: "sin tiempo para descargar" };
        continue;
      }
      try {
        out[i] = { feed, items: await loadFeedItems(feed.feedUrl), error: null };
      } catch (e) {
        out[i] = { feed, items: null, error: e instanceof Error ? e.message : String(e) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(FEED_FETCH_CONCURRENCY, feeds.length) }, worker));
  return out;
}

function summaryFromItem(item: Item): string {
  return (item.contentSnippet ?? item.summary ?? item.content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function imageFromItem(item: Item): string | null {
  const it = item as Record<string, unknown>;
  let imagen: string | null = null;
  const enclosure = it.enclosure as { url?: string } | undefined;
  if (enclosure?.url) imagen = enclosure.url;
  const media = it["media:content"] as { $?: { url?: string } } | undefined;
  if (media?.$?.url) imagen = media.$.url;
  return imagen;
}

export async function runIngest(
  supabase: SupabaseClient,
  options: IngestOptions = {},
): Promise<IngestResult> {
  const errors: string[] = [];
  const timeBudgetMs = ingestTimeBudgetMs();
  const deadlineMs = Date.now() + timeBudgetMs;
  const shard = normalizeShard(options.shardTotal, options.shardIndex);
  let timedOutEarly = false;
  let feedsScheduled = 0;
  let feedsProcessed = 0;
  let itemsSeen = 0;
  let itemsExcludedLowValue = 0;
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
  const allFeeds = list.flatMap((medio) =>
    medio.rss_urls.map((feedUrl) => ({ medio, feedUrl })),
  );
  const scheduledFeeds = pickShardFeeds(allFeeds, shard.total, shard.index);
  feedsScheduled = scheduledFeeds.length;

  const pool = await loadHistoriasPool(supabase, clusterMode === "openai");
  const poolById = new Map(pool.map((p) => [p.id, p]));
  const fetched = await fetchFeedsConcurrently(scheduledFeeds, deadlineMs);

  feedLoop: for (const { feed, items: rawItems, error: fetchError } of fetched) {
    const { medio, feedUrl } = feed;
    if (fetchError || !rawItems) {
      errors.push(`${medio.nombre} (${feedUrl}): ${fetchError ?? "sin datos"}`);
      continue;
    }
    if (Date.now() >= deadlineMs - INGEST_TIME_SAFETY_MARGIN_MS) {
      timedOutEarly = true;
      break;
    }
    feedsProcessed += 1;
    try {
      const items = rawItems.slice(0, MAX_ITEMS_PER_FEED);
      const urls = items.map((i) => i.link?.trim()).filter((u): u is string => Boolean(u));
      const known = new Set<string>();
      if (urls.length > 0) {
        const { data: existing, error: exErr } = await supabase
          .from("articulos")
          .select("url")
          .in("url", urls);
        if (exErr) throw exErr;
        for (const r of existing ?? []) known.add(r.url as string);
      }

      for (const item of items) {
        if (Date.now() >= deadlineMs - INGEST_TIME_SAFETY_MARGIN_MS) {
          timedOutEarly = true;
          break feedLoop;
        }
        itemsSeen += 1;
        const url = item.link?.trim();
        const title = (item.title ?? "").trim();
        if (!url || !title) continue;
        if (known.has(url)) {
          skippedDuplicate += 1;
          continue;
        }
        known.add(url);

        const summary = summaryFromItem(item);
        if (shouldExcludeLowValueNews(title, summary)) {
          itemsExcludedLowValue += 1;
          continue;
        }

        const imagen = imageFromItem(item);
        const fechaRaw = item.isoDate ?? item.pubDate;
        const parsedFecha = fechaRaw ? new Date(fechaRaw) : null;
        const fecha_pub =
          parsedFecha && !Number.isNaN(parsedFecha.getTime()) ? parsedFecha.toISOString() : null;
        const now = new Date().toISOString();
        const pubMs = new Date(fecha_pub ?? now).getTime();

        const embedding =
          clusterMode === "openai" ? await embedOne(pickTextForEmbedding(title, summary)) : null;
        let match = embedding ? findBestHistoriaOpenAI(pool, embedding, medio.id, pubMs) : null;
        if (!match) {
          match = findBestHistoriaLexical(pool, title, summary, lexicalThreshold, medio.id, pubMs);
        }

        let historiaId: string;
        if (match) {
          historiaId = match.id;
          const entry = poolById.get(historiaId)!;
          const update: Record<string, unknown> = { updated_at: now };
          if (embedding) {
            entry.embedding = mergeEmbeddings(entry.embedding, entry.articleCount, embedding);
            update.embedding = entry.embedding;
          }
          const { error: upErr } = await supabase
            .from("historias")
            .update(update)
            .eq("id", historiaId);
          if (upErr) throw upErr;
          entry.articleCount += 1;
          entry.ultimaPubMs = Math.max(entry.ultimaPubMs, pubMs);
          entry.porMedio.set(medio.id, (entry.porMedio.get(medio.id) ?? 0) + 1);
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
          historiaId = hNew!.id as string;
          const entry: PoolEntry = {
            id: historiaId,
            titulo_canonico: title,
            resumen_canonico: summary || null,
            embedding,
            articleCount: 1,
            ultimaPubMs: pubMs,
            porMedio: new Map([[medio.id, 1]]),
          };
          pool.unshift(entry);
          poolById.set(historiaId, entry);
        }

        const { error: insErr } = await supabase.from("articulos").insert({
          historia_id: historiaId,
          medio_id: medio.id,
          titulo: title,
          resumen: summary || null,
          url,
          fecha_pub,
          imagen_url: imagen,
          embedding,
        });
        if (insErr) throw insErr;

        await recomputeHistoria(supabase, historiaId);
        articlesInserted += 1;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${medio.nombre} (${feedUrl}): ${msg}`);
    }
  }

  return {
    ok: errors.length === 0,
    timedOutEarly,
    timeBudgetMs,
    feedsScheduled,
    feedsProcessed,
    itemsSeen,
    itemsExcludedLowValue,
    articlesInserted,
    skippedDuplicate,
    clusterMode,
    errors,
  };
}
