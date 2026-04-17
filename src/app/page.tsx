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
const HYBRID_CANDIDATE_LIMIT = 600;

type HomeOrderMode = "ultimas" | "relevantes";

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
  const ordenRaw = typeof sp.orden === "string" ? sp.orden.trim() : "";
  const orden: HomeOrderMode = ordenRaw === "relevantes" ? "relevantes" : "ultimas";
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
  const supabaseClient = supabase;

  const [{ data: mediosOpts }, stats] = await Promise.all([
    supabaseClient
      .from("medios")
      .select("slug, nombre")
      .eq("active", true)
      .order("nombre"),
    fetchCatalogStats(supabaseClient),
  ]);

  let historiaIdsMedio: string[] | null = null;
  if (medioSlug) {
    const { data: med } = await supabaseClient
      .from("medios")
      .select("id")
      .eq("slug", medioSlug)
      .maybeSingle();
    if (!med?.id) {
      historiaIdsMedio = [];
    } else {
      const { data: arts } = await supabaseClient
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

  let listQuery = buildHistoriasSelect(supabaseClient, {
    ...filterBase,
    searchMode: "fts",
  });
  let historias: HistoriaRow[] = [];
  let error: { message: string } | null = null;
  let hasMore = false;

  async function runQuery(searchMode: "fts" | "ilike") {
    listQuery = buildHistoriasSelect(supabaseClient, {
      ...filterBase,
      searchMode,
    });

    if (orden === "relevantes") {
      const ordered = listQuery.order("importancia", { ascending: false });
      const res = await ordered.range(from, to);
      return {
        data: (res.data ?? []) as HistoriaRow[],
        error: res.error ? { message: res.error.message } : null,
        hasMoreLocal: (res.data ?? []).length === HISTORIAS_PAGE_SIZE,
      };
    }

    // Hibrido: recencia + importancia (no 100% por fecha).
    const res = await listQuery
      .order("ultima_pub", { ascending: false, nullsFirst: false })
      .limit(HYBRID_CANDIDATE_LIMIT);
    if (res.error) {
      return { data: [] as HistoriaRow[], error: { message: res.error.message }, hasMoreLocal: false };
    }
    const candidates = (res.data ?? []) as HistoriaRow[];
    const sorted = sortHistoriasHybrid(candidates);
    return {
      data: sorted.slice(from, to + 1),
      error: null,
      hasMoreLocal: sorted.length > to + 1 || candidates.length === HYBRID_CANDIDATE_LIMIT,
    };
  }

  ({ data: historias, error, hasMoreLocal: hasMore } = await runQuery("fts"));

  if (error && q.length > 0) {
    ({ data: historias, error, hasMoreLocal: hasMore } = await runQuery("ilike"));
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

  const rows = historias ?? [];

  const ids = rows.map((r) => r.id);
  const [{ data: trendTitulos }, covers, coverageMixes] = await Promise.all([
    supabaseClient
      .from("historias")
      .select("titulo_canonico")
      .order("importancia", { ascending: false })
      .limit(120),
    fetchCoverImagesByHistoriaIds(supabaseClient, ids),
    fetchCoverageMixByHistoriaIds(supabaseClient, ids),
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
  if (orden === "relevantes") paginationQuery.orden = "relevantes";

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
          <div className="mb-4">
            <HomeOrderTabs
              orden={orden}
              query={{
                q: qRaw.trim() ? qRaw : undefined,
                medio: medioSlug || undefined,
                ventana: ventana !== "all" ? ventana : undefined,
                orientacion: orientacion || undefined,
              }}
            />
          </div>
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

function historiasTimestampMs(h: HistoriaRow): number {
  const raw = h.ultima_pub ?? h.created_at ?? null;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

function sortHistoriasHybrid(rows: HistoriaRow[]): HistoriaRow[] {
  if (rows.length <= 1) return rows;
  const maxImportance = rows.reduce(
    (m, r) => Math.max(m, Math.max(0, Number(r.importancia ?? 0))),
    1,
  );
  const now = Date.now();
  const horizonHours = 72;
  const horizonMs = horizonHours * 3600_000;

  const scored = rows.map((r) => {
    const imp = Math.max(0, Number(r.importancia ?? 0));
    const impNorm = Math.log1p(imp) / Math.log1p(maxImportance);
    const ageMs = Math.max(0, now - historiasTimestampMs(r));
    const recencyNorm = Math.max(0, 1 - ageMs / horizonMs);
    const score = impNorm * 0.62 + recencyNorm * 0.38;
    return { row: r, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ta = historiasTimestampMs(a.row);
    const tb = historiasTimestampMs(b.row);
    if (tb !== ta) return tb - ta;
    return Number(b.row.importancia ?? 0) - Number(a.row.importancia ?? 0);
  });
  return scored.map((x) => x.row);
}

function HomeOrderTabs({
  orden,
  query,
}: {
  orden: HomeOrderMode;
  query: {
    q?: string;
    medio?: string;
    ventana?: string;
    orientacion?: string;
  };
}) {
  const mkHref = (nextOrden: HomeOrderMode) => {
    const sp = new URLSearchParams();
    if (query.q) sp.set("q", query.q);
    if (query.medio) sp.set("medio", query.medio);
    if (query.ventana) sp.set("ventana", query.ventana);
    if (query.orientacion) sp.set("orientacion", query.orientacion);
    if (nextOrden === "relevantes") sp.set("orden", "relevantes");
    const qs = sp.toString();
    return qs ? `/?${qs}` : "/";
  };

  const tabClass = (active: boolean) =>
    `inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
      active
        ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
        : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={mkHref("ultimas")} className={tabClass(orden === "ultimas")}>
        Ultimas
      </Link>
      <Link
        href={mkHref("relevantes")}
        className={tabClass(orden === "relevantes")}
      >
        Mas relevantes
      </Link>
    </div>
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
