import { PaginationBar } from "@/components/PaginationBar";
import { StoryCard } from "@/components/StoryCard";
import { StoryFilters } from "@/components/StoryFilters";
import { FeedEmailSignup } from "@/components/FeedEmailSignup";
import { TrendingChips } from "@/components/TrendingChips";
import { FEED_COOKIE } from "@/lib/feed-cookie";
import { resolveFeedMedioSlugs } from "@/lib/feed-resolve";
import { fetchCoverageMixByHistoriaIds } from "@/lib/coverage-mix";
import { fetchCoverImagesByHistoriaIds } from "@/lib/historia-covers";
import { buildHistoriasSelect } from "@/lib/historias-query-build";
import { historiaIdsForMedioSlugs } from "@/lib/historias-repo";
import {
  fetchHistoriaIdsForOrientacion,
  intersectHistoriaIds,
  parseOrientacionFiltro,
} from "@/lib/orientacion-filter";
import { HISTORIAS_PAGE_SIZE } from "@/lib/historias-page-size";
import type { HistoriaRow } from "@/lib/types";
import { sanitizeSearchInput } from "@/lib/search-sanitize";
import { trendingTermsFromTitles } from "@/lib/trending-keywords";
import { createServerSupabaseOrNull } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Para ti",
  description:
    "Tu feed personal: inicia sesión con correo para guardar medios en tu cuenta o usa una cookie en este navegador.",
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
  const orientacionRaw =
    typeof sp.orientacion === "string" ? sp.orientacion.trim() : "";
  const orientacion = parseOrientacionFiltro(orientacionRaw);

  const supabase = await createServerSupabaseOrNull();
  const jar = await cookies();
  const raw = jar.get(FEED_COOKIE)?.value ?? "";

  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-zinc-600">
        Configura Supabase en <code>.env.local</code>.
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { slugs: feedSlugs, source: feedSource } = await resolveFeedMedioSlugs(
    supabase,
    user,
    raw,
  );

  const { data: mediosOpts } = await supabase
    .from("medios")
    .select("slug, nombre")
    .eq("active", true)
    .order("nombre");

  if (feedSlugs.length === 0) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-10 sm:px-6 lg:max-w-3xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
            Para ti
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Tu feed personal
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <Link
              href="/login"
              className="font-semibold text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
            >
              Entra con tu correo
            </Link>{" "}
            para que sepamos quién eres y guardemos tus medios en la cuenta; o
            sigue medios al instante solo en este navegador (cookie).
          </p>
        </header>
        <FeedEmailSignup />
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
        <FeedHeader feedSource={feedSource} slugs={feedSlugs} />
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

  let historiaIdsFiltered = historiaIds;
  if (orientacion) {
    const orientIds = await fetchHistoriaIdsForOrientacion(
      supabase,
      orientacion,
      MAX_IN,
    );
    historiaIdsFiltered = intersectHistoriaIds(historiaIds, orientIds);
  }

  if (historiaIdsFiltered.length === 0) {
    return (
      <main className="mx-auto max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <FeedHeader feedSource={feedSource} slugs={feedSlugs} />
        <p className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40">
          Ninguna historia de tus medios seguidos tiene cobertura con esa orientación.
          Prueba <strong>Todas</strong> u otra opción en el filtro.
        </p>
        <div className="mt-8">
          <StoryFilters
            q={qRaw}
            medio=""
            ventana={ventana}
            orientacion={orientacion}
            medios={mediosOpts ?? []}
            action="/feed"
            showMedio={false}
            clearHref="/feed"
            title="Filtrar historias"
            subtitle="Ajusta búsqueda, fechas y cobertura; los resultados son solo de tus medios seguidos."
          />
        </div>
      </main>
    );
  }

  const from = (page - 1) * HISTORIAS_PAGE_SIZE;
  const to = from + HISTORIAS_PAGE_SIZE - 1;

  const filterBase = {
    idsIn: historiaIdsFiltered,
    ventana,
    searchTerm: q,
  };

  let listQuery = buildHistoriasSelect(supabase, {
    ...filterBase,
    searchMode: "fts",
  });

  let ordered = listQuery.order("importancia", { ascending: false });

  let { data: historias, error } = await ordered.range(from, to);

  if (error && q.length > 0) {
    listQuery = buildHistoriasSelect(supabase, {
      ...filterBase,
      searchMode: "ilike",
    });
    ordered = listQuery.order("importancia", { ascending: false });
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
      .limit(120),
    fetchCoverImagesByHistoriaIds(supabase, ids),
    fetchCoverageMixByHistoriaIds(supabase, ids),
  ]);

  const trending = trendingTermsFromTitles(
    (trendTitulos ?? []).map(
      (r: { titulo_canonico: string | null }) =>
        r.titulo_canonico as string,
    ),
    12,
  );

  const paginationQuery: Record<string, string> = {};
  if (qRaw.trim()) paginationQuery.q = qRaw;
  if (ventana && ventana !== "all") paginationQuery.ventana = ventana;
  if (orientacion) paginationQuery.orientacion = orientacion;

  const showFeaturedBlock =
    page === 1 &&
    !q.trim() &&
    ventana === "all" &&
    !orientacion &&
    rows.length > 0;
  const [featured, rest] =
    showFeaturedBlock && rows.length > 0
      ? [rows[0], rows.slice(1)]
      : [null, rows];

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <FeedHeader feedSource={feedSource} slugs={feedSlugs} />
      <TrendingChips terms={trending} queryBase="/feed" />
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        {feedSource === "auth"
          ? `Historias donde interviene al menos uno de tus medios (${feedSlugs.length} en tu cuenta).`
          : `Historias donde interviene al menos uno de tus medios (${feedSlugs.length} en la cookie de este navegador). `}
        {feedSource === "cookie" ? (
          <Link
            href="/login"
            className="font-semibold text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
          >
            Entrar con correo
          </Link>
        ) : null}
        {feedSource === "cookie" ? " para guardarlos en tu cuenta." : null}
      </p>
      <div className="mb-8">
        <StoryFilters
          q={qRaw}
          medio=""
          ventana={ventana}
          orientacion={orientacion}
          medios={mediosOpts ?? []}
          action="/feed"
          showMedio={false}
          clearHref="/feed"
          title="Filtrar historias"
          subtitle="Ajusta búsqueda, fechas y cobertura; los resultados son solo de tus medios seguidos."
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

function FeedHeader({
  slugs,
  feedSource,
}: {
  slugs: string[];
  feedSource: "auth" | "cookie" | "none";
}) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
          Para ti
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tu feed
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Medios seguidos: {slugs.length ? slugs.join(", ") : "—"}
        </p>
        {feedSource === "auth" ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Sesión con correo: la selección está guardada para tu usuario.
          </p>
        ) : feedSource === "cookie" ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Sin sesión: la lista solo vive en la cookie de este navegador.
          </p>
        ) : null}
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
