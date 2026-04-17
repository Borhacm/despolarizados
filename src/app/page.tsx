import { PaginationBar } from "@/components/PaginationBar";
import { StatsStrip } from "@/components/StatsStrip";
import { StoryCard } from "@/components/StoryCard";
import { StoryFilters } from "@/components/StoryFilters";
import { fetchCatalogStats, type CatalogStats } from "@/lib/db-stats";
import { HISTORIAS_PAGE_SIZE } from "@/lib/historias-page-size";
import { fetchCoverageMixByHistoriaIds } from "@/lib/coverage-mix";
import { fetchCoverImagesByHistoriaIds } from "@/lib/historia-covers";
import { buildHistoriasSelect } from "@/lib/historias-query-build";
import {
  fetchHistoriaIdsForOrientacion,
  intersectHistoriaIds,
  parseOrientacionFiltro,
} from "@/lib/orientacion-filter";
import { sanitizeSearchInput } from "@/lib/search-sanitize";
import type { HistoriaRow } from "@/lib/types";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { createPublicClient } from "@/lib/supabase/public";
import { HistoriasEmptyState } from "@/components/HistoriasEmptyState";
import { LogoMark } from "@/components/LogoMark";
import { TrendingChips } from "@/components/TrendingChips";
import { trendingTermsFromTitles } from "@/lib/trending-keywords";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Historias desde varios medios: contexto y cobertura para leer con más perspectiva.",
};

const MAX_IN = 1000;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  const supabase = createPublicClient();
  const base = getAppBaseUrl();
  const sp = await searchParams;

  const qRaw = typeof sp.q === "string" ? sp.q : "";
  const medioSlug = typeof sp.medio === "string" ? sp.medio.trim() : "";
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

  const filtersActive =
    q.trim() !== "" ||
    medioSlug !== "" ||
    ventana !== "all" ||
    orientacion !== "";

  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl flex-1 overflow-x-clip px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Configura Supabase
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Copia{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
            .env.example
          </code>{" "}
          a{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
            .env.local
          </code>{" "}
          y rellena URL y anon key.
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          Ejecuta la migración SQL en Supabase y luego{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
            seed_medios.sql
          </code>
          .
        </p>
      </main>
    );
  }

  const [{ data: mediosOpts }, stats] = await Promise.all([
    supabase
      .from("medios")
      .select("slug, nombre")
      .eq("active", true)
      .order("nombre"),
    fetchCatalogStats(supabase),
  ]);

  let historiaIdsMedio: string[] | null = null;
  if (medioSlug) {
    const { data: med } = await supabase
      .from("medios")
      .select("id")
      .eq("slug", medioSlug)
      .maybeSingle();
    if (!med?.id) {
      historiaIdsMedio = [];
    } else {
      const { data: arts } = await supabase
        .from("articulos")
        .select("historia_id")
        .eq("medio_id", med.id);
      historiaIdsMedio = [
        ...new Set(
          (arts ?? [])
            .map((a) => a.historia_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ].slice(0, MAX_IN);
    }
  }

  if (historiaIdsMedio && historiaIdsMedio.length === 0) {
    return (
      <main className="mx-auto max-w-5xl flex-1 overflow-x-clip px-4 py-10 sm:px-6">
        <HomeHeader stats={stats} />
        <StoryFilters
          q={qRaw}
          medio={medioSlug}
          ventana={ventana}
          orientacion={orientacion}
          medios={mediosOpts ?? []}
          title="Historias del momento"
          subtitle="Busca en titulares y resúmenes; filtra por medio, fechas o cobertura editorial."
          collapsible
          defaultOpen={filtersActive}
        />
        <p className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
          No hay historias con ese medio o el medio no existe.
        </p>
      </main>
    );
  }

  let historiaIdsIn: string[] | undefined;
  if (orientacion) {
    const orientIds = await fetchHistoriaIdsForOrientacion(
      supabase,
      orientacion,
      MAX_IN,
    );
    if (historiaIdsMedio !== null) {
      historiaIdsIn = intersectHistoriaIds(historiaIdsMedio, orientIds);
    } else {
      historiaIdsIn = orientIds.length > 0 ? orientIds : [];
    }
  } else {
    historiaIdsIn = historiaIdsMedio ?? undefined;
  }

  if (historiaIdsIn !== undefined && historiaIdsIn.length === 0) {
    return (
      <main className="mx-auto max-w-5xl flex-1 overflow-x-clip px-4 py-10 sm:px-6">
        <HomeHeader stats={stats} />
        <StoryFilters
          q={qRaw}
          medio={medioSlug}
          ventana={ventana}
          orientacion={orientacion}
          medios={mediosOpts ?? []}
          title="Historias del momento"
          subtitle="Busca en titulares y resúmenes; filtra por medio, fechas o cobertura editorial."
          collapsible
          defaultOpen={filtersActive}
        />
        <p className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
          No hay historias con cobertura de esa orientación (con los filtros
          actuales).
        </p>
      </main>
    );
  }

  const from = (page - 1) * HISTORIAS_PAGE_SIZE;
  const to = from + HISTORIAS_PAGE_SIZE - 1;

  const filterBase = {
    idsIn: historiaIdsIn,
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
      <main className="mx-auto max-w-3xl flex-1 overflow-x-clip px-4 py-16 text-center">
        <p className="font-medium text-red-600">Error al cargar historias</p>
        <p className="mt-2 font-mono text-sm text-red-600/90">{error.message}</p>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Comprueba la migración inicial y, si buscas por texto, la migración FTS:{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            20260415000000_historias_fts.sql
          </code>
          .
        </p>
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
    (trendTitulos ?? []).map((r) => r.titulo_canonico as string),
    12,
  );

  const paginationQuery: Record<string, string> = {};
  if (qRaw.trim()) paginationQuery.q = qRaw;
  if (medioSlug) paginationQuery.medio = medioSlug;
  if (ventana && ventana !== "all") paginationQuery.ventana = ventana;
  if (orientacion) paginationQuery.orientacion = orientacion;

  const showFeaturedBlock =
    page === 1 &&
    !q.trim() &&
    !medioSlug &&
    ventana === "all" &&
    !orientacion &&
    rows.length > 0;

  const [featured, rest] =
    showFeaturedBlock && rows.length > 0
      ? [rows[0], rows.slice(1)]
      : [null, rows];

  return (
    <main className="mx-auto max-w-6xl flex-1 overflow-x-clip px-4 py-10 sm:px-6">
      <HomeHeader stats={stats} />
      <TrendingChips terms={trending} collapsible defaultOpen={false} />
      <div className="relative isolate">
        <div
          className="pointer-events-none absolute -right-6 top-0 z-0 select-none sm:-right-10 sm:top-4 md:top-8"
          aria-hidden
        >
          <LogoMark
            size="pageBackdropHome"
            className="opacity-[0.08] dark:opacity-[0.11]"
          />
        </div>
        <div className="relative z-10">
          <div className="mb-8">
            <StoryFilters
              q={qRaw}
              medio={medioSlug}
              ventana={ventana}
              orientacion={orientacion}
              medios={mediosOpts ?? []}
              title="Historias del momento"
              subtitle="Busca en titulares y resúmenes; filtra por medio, fechas o cobertura editorial."
              collapsible
              defaultOpen={filtersActive}
            />
          </div>

          {rows.length === 0 ? (
            stats.historias === 0 ? (
              <HistoriasEmptyState variant="no-catalog" />
            ) : (
              <HistoriasEmptyState variant="no-match" />
            )
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
                    shareUrl={`${base}/historia/${featured.id}`}
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
                      shareUrl={`${base}/historia/${h.id}`}
                    />
                  </li>
                ))}
              </ul>
              <PaginationBar
                page={page}
                hasMore={hasMore}
                query={paginationQuery}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function HomeHeader({ stats }: { stats: CatalogStats }) {
  const dateLine = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mb-8 rounded-2xl border border-zinc-200/80 bg-[var(--surface)] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950/35 sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex justify-center lg:hidden">
          <LogoMark size="pageHero" className="shrink-0" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
            {dateLine}
          </p>
          <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Ve todos los lados de cada noticia
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Agrupamos la misma historia desde varios medios españoles y mostramos
            cómo se reparte la cobertura en el espectro editorial (referencia
            orientativa).{" "}
            <Link
              href="/medios"
              className="font-semibold text-emerald-700 underline decoration-emerald-300/80 underline-offset-[3px] transition hover:text-emerald-900 hover:decoration-emerald-500 dark:text-emerald-400 dark:decoration-emerald-700 dark:hover:text-emerald-300"
            >
              Medios
            </Link>{" "}
            ·{" "}
            <Link
              href="/feed"
              className="font-semibold text-emerald-700 underline decoration-emerald-300/80 underline-offset-[3px] transition hover:text-emerald-900 hover:decoration-emerald-500 dark:text-emerald-400 dark:decoration-emerald-700 dark:hover:text-emerald-300"
            >
              Para ti
            </Link>{" "}
            ·{" "}
            <Link
              href="/angulo-muerto"
              className="font-semibold text-emerald-700 underline decoration-emerald-300/80 underline-offset-[3px] transition hover:text-emerald-900 hover:decoration-emerald-500 dark:text-emerald-400 dark:decoration-emerald-700 dark:hover:text-emerald-300"
            >
              Ángulo muerto
            </Link>
            .
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col items-end gap-5 sm:gap-6 lg:w-auto">
          <div className="hidden lg:block">
            <LogoMark size="pageHero" className="shrink-0" />
          </div>
          <StatsStrip stats={stats} />
        </div>
      </div>
    </div>
  );
}
