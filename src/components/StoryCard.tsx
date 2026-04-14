import { CoverageMixBar } from "@/components/CoverageMixBar";
import type { CoverageMix } from "@/lib/coverage-mix";
import type { HistoriaRow } from "@/lib/types";
import Link from "next/link";

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function skewLabelEs(
  label: "izquierda" | "centro" | "derecha",
): string {
  if (label === "izquierda") return "izquierda";
  if (label === "derecha") return "derecha";
  return "centro";
}

export function StoryCard({
  h,
  coverUrl,
  coverageMix,
  layout = "stack",
  blindspotHint,
  size = "default",
}: {
  h: HistoriaRow;
  coverUrl?: string | null;
  coverageMix?: CoverageMix | null;
  layout?: "stack" | "split";
  blindspotHint?: {
    label: "izquierda" | "centro" | "derecha";
    pct: number;
  };
  /** Primera historia en portada (bloque grande tipo “Top news”). */
  size?: "default" | "featured";
}) {
  const isFeatured = size === "featured";
  const inner = (
    <>
      {coverUrl ? (
        <div
          className={
            isFeatured && layout === "split"
              ? "relative aspect-[21/9] w-full shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900 sm:aspect-auto sm:min-h-[200px] md:min-h-[260px] md:w-[46%]"
              : layout === "split"
                ? "relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900 sm:aspect-auto sm:h-auto sm:min-h-[148px] sm:w-56 md:w-64"
                : "relative aspect-[2/1] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900"
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- dominios RSS heterogéneos */}
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}
      <div
        className={
          coverUrl
            ? layout === "split"
              ? isFeatured
                ? "flex flex-1 flex-col justify-center space-y-4 p-6 sm:py-8 md:p-10"
                : "flex flex-1 flex-col justify-center space-y-3 p-5 sm:py-6"
              : "space-y-3 p-5 pt-4"
            : isFeatured
              ? "space-y-4 p-6 md:p-10"
              : "space-y-3 p-5"
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="rounded-md border border-zinc-200/90 bg-zinc-50 px-2.5 py-0.5 font-semibold tabular-nums text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200">
            {h.medio_count} fuentes · {h.article_count} artículos
          </span>
          {h.ultima_pub ? (
            <time dateTime={h.ultima_pub}>{formatWhen(h.ultima_pub)}</time>
          ) : null}
        </div>
        {blindspotHint ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Cobertura dominante: {skewLabelEs(blindspotHint.label)} (~
            {blindspotHint.pct}%)
          </p>
        ) : null}
        {isFeatured ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
            Historia destacada
          </p>
        ) : null}
        <h2
          className={
            isFeatured
              ? "text-balance text-2xl font-bold leading-tight tracking-tight text-zinc-900 group-hover:text-emerald-900 dark:text-zinc-50 dark:group-hover:text-emerald-200 sm:text-3xl"
              : layout === "split"
                ? "text-xl font-bold leading-snug tracking-tight text-zinc-900 group-hover:text-emerald-900 dark:text-zinc-50 dark:group-hover:text-emerald-200"
                : "text-lg font-semibold leading-snug text-zinc-900 group-hover:text-emerald-900 dark:text-zinc-50 dark:group-hover:text-emerald-200"
          }
        >
          {h.titulo_canonico}
        </h2>
        {h.resumen_canonico ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {h.resumen_canonico}
          </p>
        ) : null}
        {coverageMix ? (
          <CoverageMixBar
            mix={coverageMix}
            size="compact"
            footnote="short"
            className="pt-1"
          />
        ) : null}
        <span className="inline-flex items-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Comparar titulares
          <span className="ml-1 transition group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </>
  );

  return (
    <article
      className={
        isFeatured
          ? "group overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-emerald-100/90 transition hover:border-emerald-300/90 hover:shadow-[0_16px_48px_-12px_rgba(15,23,42,0.16)] dark:border-emerald-900/45 dark:bg-zinc-950/60 dark:ring-emerald-950/30 dark:hover:border-emerald-700/60"
          : layout === "split"
            ? "group overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm transition hover:border-emerald-200/90 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-emerald-800/50"
            : "group overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm transition hover:border-emerald-200/90 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-emerald-800/50"
      }
    >
      <Link
        href={`/historia/${h.id}`}
        className={layout === "split" ? "flex flex-col sm:flex-row" : "block"}
      >
        {inner}
      </Link>
    </article>
  );
}
