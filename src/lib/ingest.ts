import Parser from "rss-parser";
import type { Item } from "rss-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recomputeHistoria } from "@/lib/historia-recompute";
import { embedOne } from "@/lib/embeddings";
import { getIngestClusterMode } from "@/lib/ingest-mode";
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

const FETCH_TIMEOUT_MS = 25000;

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
        "User-Agent": "Despolarizados/0.1 (aggregator)",
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
  const t = embeddingMatchThreshold();
  let best: { id: string; score: number } | null = null;
  for (const h of pool) {
    if (!h.embedding) continue;
    const score = cosineSimilarity(vec, h.embedding);
    if (score >= t && (!best || score > best.score)) {
      best = { id: h.id, score };
    }
  }
  return best;
}

function findBestHistoriaLexical(
  pool: PoolLexical[],
  title: string,
  summary: string,
  threshold: number,
): { id: string; score: number } | null {
  let best: { id: string; score: number } | null = null;
  for (const h of pool) {
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
  /** Siempre cargado: modo léxico lo usa siempre; OpenAI lo usa como segundo intento si el embedding no casa. */
  let poolLexical: PoolLexical[] = await loadHistoriasPoolLexical(supabase);

  for (const medio of list) {
    for (const feedUrl of medio.rss_urls) {
      feedsProcessed += 1;
      try {
        const items = (await loadFeedItems(feedUrl)).slice(0, MAX_ITEMS_PER_FEED);
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
            let match = findBestHistoriaOpenAI(poolOpenAI, embedding);
            if (!match) {
              match = findBestHistoriaLexical(
                poolLexical,
                title,
                summary,
                lexicalThreshold,
              );
            }

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
              poolLexical = await loadHistoriasPoolLexical(supabase);
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
              poolLexical = await loadHistoriasPoolLexical(supabase);
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
