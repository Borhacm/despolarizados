import { PaginationBar } from "@/components/PaginationBar";
import { StoryCard } from "@/components/StoryCard";
import { StoryFilters } from "@/components/StoryFilters";
import { TrendingChips } from "@/components/TrendingChips";
import { FEED_COOKIE, parseFeedSlugs } from "@/lib/feed-cookie";
import { fetchCoverageMixByHistoriaIds } from "@/lib/coverage-mix";
import { fetchCoverImagesByHistoriaIds } from "@/lib/historia-covers";
import { buildHistoriasSelect } from "@/lib/historias-query-build";
import { historiaIdsForMedioSlugs } from "@/lib/historias-repo";
import { parseListOrden } from "@/lib/list-orden";
import { HISTORIAS_PAGE_SIZE } from "@/lib/historias-page-size";
import type { HistoriaRow } from "@/lib/types";
import { sanitizeSearchInput } from "@/lib/search-sanitize";
import { trendingKeywordsFromTitles } from "@/lib/trending-keywords";
import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi feed",
  description:
    "Historias donde participan los medios que sigues (guardado en este navegador).",
};

const MAX_IN = 1000;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FeedPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const qRaw = typeof sp.q === "string" ? sp.q : "";
  const ventana =
    typeof sp.ventana === "string" ? sp.ventana.trim() : "all";
  const pageRaw = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const page = Math.max(
    1,
    Math.min(200, Number.isFinite(pageRaw) ? pageRaw : 1),
  );
  const q = sanitizeSearchInput(qRaw);
  const ordenRaw = typeof sp.orden === "string" ? sp.orden : "";
  const orden = parseListOrden(ordenRaw);

  const supabase = createPublicClient();
  const jar = await cookies();
  const raw = jar.get(FEED_COOKIE)?.value ?? "";
  const feedSlugs = parseFeedSlugs(raw);

  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-zinc-600">
        Configura Supabase en <code>.env.local</code>.
      </main>
    );
  }

  const { data: mediosOpts } = await supabase
    .from("medios")
    .select("slug, nombre")
    .eq("active", true)
    .order("nombre");

  if (feedSlugs.length === 0) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Mi feed
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Aún no sigues ningún medio. Entra en la{" "}
          <Link
            href="/medios"
            className="font-semibold text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ficha de un medio
          </Link>{" "}
          y pulsa <strong>Seguir en Mi feed</strong>. La lista se guarda en una
          cookie en este navegador (sin cuenta).
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400"
          >
            ← Todas las historias
          </Link>
        </p>
      </main>
    );
  }

  let historiaIds: string[];
  try {
    const ids = await historiaIdsForMedioSlugs(supabase, feedSlugs);
    historiaIds = ids.slice(0, MAX_IN);
  } catch {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-red-600">
        Error al cargar el feed.
      </main>
    );
  }

  if (historiaIds.length === 0) {
    return (
      <main className="mx-auto max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <FeedHeader slugs={feedSlugs} />
        <p className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40">
          No hay historias agrupadas aún para estos medios. Espera a la ingesta
          o añade más medios en{" "}
          <Link href="/medios" className="text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400">
            el catálogo
          </Link>
          .
        </p>
      </main>
    );
  }

  const from = (page - 1) * HISTORIAS_PAGE_SIZE;
  const to = from + HISTORIAS_PAGE_SIZE - 1;

  const filterBase = {
    idsIn: historiaIds,
    ventana,
    searchTerm: q,
  };

  let listQuery = buildHistoriasSelect(supabase, {
    ...filterBase,
    searchMode: "fts",
  });

  let ordered =
    orden === "reciente"
      ? listQuery.order("ultima_pub", { ascending: false, nullsFirst: false })
      : listQuery.order("importancia", { ascending: false });

  let { data: historias, error } = await ordered.range(from, to);

  if (error && q.length > 0) {
    listQuery = buildHistoriasSelect(supabase, {
      ...filterBase,
      searchMode: "ilike",
    });
    ordered =
      orden === "reciente"
        ? listQuery.order("ultima_pub", { ascending: false, nullsFirst: false })
        : listQuery.order("importancia", { ascending: false });
    ({ data: historias, error } = await ordered.range(from, to));
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center">
        <p className="font-medium text-red-600">Error al cargar historias</p>
        <p className="mt-2 font-mono text-sm text-red-600/90">{error.message}</p>
      </main>
    );
  }

  const rows = (historias ?? []) as HistoriaRow[];
  const hasMore = rows.length === HISTORIAS_PAGE_SIZE;

  const ids = rows.map((r) => r.id);
  const [{ data: trendTitulos }, covers, coverageMixes] = await Promise.all([
    supabase
      .from("historias")
      .select("titulo_canonico")
      .order("importancia", { ascending: false })
      .limit(80),
    fetchCoverImagesByHistoriaIds(supabase, ids),
    fetchCoverageMixByHistoriaIds(supabase, ids),
  ]);

  const trending = trendingKeywordsFromTitles(
    (trendTitulos ?? []).map((r) => r.titulo_canonico as string),
    10,
  );

  const paginationQuery: Record<string, string> = {};
  if (qRaw.trim()) paginationQuery.q = qRaw;
  if (ventana && ventana !== "all") paginationQuery.ventana = ventana;
  if (orden === "reciente") paginationQuery.orden = "reciente";

  const showFeaturedBlock =
    page === 1 && !q.trim() && ventana === "all" && rows.length > 0;
  const [featured, rest] =
    showFeaturedBlock && rows.length > 0
      ? [rows[0], rows.slice(1)]
      : [null, rows];

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <FeedHeader slugs={feedSlugs} />
      <TrendingChips terms={trending} queryBase="/feed" />
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Mostrando historias donde hay cobertura de al menos uno de tus medios
        seguidos ({feedSlugs.length} en la cookie).
      </p>
      <div className="mb-8">
        <StoryFilters
          q={qRaw}
          medio=""
          ventana={ventana}
          orden={orden}
          medios={mediosOpts ?? []}
          action="/feed"
          showMedio={false}
          clearHref="/feed"
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="text-zinc-600 dark:text-zinc-400">
            Nada que coincida con la búsqueda o la ventana de fechas.
          </p>
        </div>
      ) : (
        <>
          {featured ? (
            <div className="mb-8">
              <StoryCard
                h={featured}
                coverUrl={covers.get(featured.id)}
                coverageMix={coverageMixes.get(featured.id) ?? null}
                layout="split"
                size="featured"
              />
            </div>
          ) : null}
          <ul className="space-y-5">
            {rest.map((h) => (
              <li key={h.id}>
                <StoryCard
                  h={h}
                  coverUrl={covers.get(h.id)}
                  coverageMix={coverageMixes.get(h.id) ?? null}
                  layout="split"
                />
              </li>
            ))}
          </ul>
          <PaginationBar
            page={page}
            hasMore={hasMore}
            query={paginationQuery}
            pathname="/feed"
          />
        </>
      )}
    </main>
  );
}

function FeedHeader({ slugs }: { slugs: string[] }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mi feed
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Medios: {slugs.join(", ")}
        </p>
      </div>
      <Link
        href="/"
        className="text-sm font-semibold text-emerald-700 decoration-emerald-300/70 underline-offset-2 hover:underline dark:text-emerald-400"
      >
        ← Todas las historias
      </Link>
    </div>
  );
}
