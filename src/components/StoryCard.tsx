import { CoverageMixBar } from "@/components/CoverageMixBar";
import { StoryCardShareButton } from "@/components/StoryCardShareButton";
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

/** Misma huella que una foto para alinear filas del listado. */
function MediaPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-center gap-1 bg-gradient-to-br from-zinc-100 to-zinc-200/90 px-3 py-2 text-zinc-400 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-500">
      <svg
        className="h-8 w-8 opacity-60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="11" r="1.5" fill="currentColor" stroke="none" />
        <path d="m21 15-5-5-4 4-2-2-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[10px] font-medium uppercase tracking-wide">
        Sin imagen
      </span>
    </div>
  );
}

export function StoryCard({
  h,
  coverUrl,
  coverageMix,
  layout = "stack",
  blindspotHint,
  size = "default",
  shareUrl,
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
  /** URL absoluta de la historia (compartir desde la card). */
  shareUrl: string;
}) {
  const isFeatured = size === "featured";
  const isSplit = layout === "split";

  const splitMediaShell =
    isFeatured && isSplit
      ? "relative w-full shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 aspect-[21/9] sm:aspect-auto sm:min-h-[200px] md:min-h-[260px]"
      : "relative w-full shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 aspect-[4/3] sm:aspect-auto sm:h-[152px] sm:w-56 md:w-64";

  const stackMediaShell =
    "relative aspect-[2/1] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900";

  /** El padding horizontal lo lleva el `Link` en split para alinear foto y texto. */
  const bodySplit = isFeatured
    ? "flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-0 py-4 sm:gap-4 sm:py-0"
    : "flex min-h-0 min-w-0 flex-1 flex-col gap-3 px-0 py-4 sm:gap-3 sm:py-0";

  const bodyStack = isFeatured
    ? "flex flex-col gap-3 p-6 sm:gap-4 md:p-10"
    : "flex flex-col gap-3 p-5";

  const titleClass = isFeatured
    ? "line-clamp-4 text-balance text-2xl font-bold leading-tight tracking-tight text-zinc-900 group-hover:text-emerald-900 dark:text-zinc-50 dark:group-hover:text-emerald-200 sm:text-3xl"
    : isSplit
      ? "line-clamp-3 text-xl font-bold leading-snug tracking-tight text-zinc-900 group-hover:text-emerald-900 dark:text-zinc-50 dark:group-hover:text-emerald-200"
      : "line-clamp-3 text-lg font-semibold leading-snug text-zinc-900 group-hover:text-emerald-900 dark:text-zinc-50 dark:group-hover:text-emerald-200";

  const summaryClass =
    "line-clamp-3 min-h-0 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:min-h-[4.25rem]";

  const mediaBlock =
    isSplit ? (
      <div className={splitMediaShell}>
        {coverUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- dominios RSS heterogéneos */}
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover object-left transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </>
        ) : (
          <MediaPlaceholder />
        )}
      </div>
    ) : coverUrl ? (
      <div className={stackMediaShell}>
        {/* eslint-disable-next-line @next/next/no-img-element -- dominios RSS heterogéneos */}
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    ) : null;

  /** En destacada, desde `sm:flex-row` hay que acotar el ancho de la foto; si sigue `w-full`, el texto queda con 0px hasta `md`. */
  const splitLeftColClass = isFeatured
    ? "flex w-full shrink-0 flex-col gap-2 sm:w-[46%] sm:max-w-[min(100%,28rem)]"
    : "flex w-full shrink-0 flex-col gap-2 sm:w-56 md:w-64";

  const compareCta = (
    <span className="inline-flex items-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
      Comparar titulares
      <span className="ml-1 transition group-hover:translate-x-0.5">→</span>
    </span>
  );

  const href = `/historia/${h.id}`;

  const dateRow = (
    <div className="flex min-h-[1.25rem] w-full min-w-0 items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      <div className="min-w-0 shrink">
        <Link
          href={href}
          className="block min-w-0 hover:text-emerald-700 dark:hover:text-emerald-300"
        >
          {h.ultima_pub ? (
            <time dateTime={h.ultima_pub}>{formatWhen(h.ultima_pub)}</time>
          ) : (
            <span className="invisible tabular-nums" aria-hidden>
              —
            </span>
          )}
        </Link>
      </div>
      <StoryCardShareButton
        historiaId={h.id}
        title={h.titulo_canonico}
        shareUrl={shareUrl}
        visual={{
          coverImageUrl: coverUrl ?? null,
          mix: coverageMix ?? null,
          medioCount: h.medio_count,
          articleCount: h.article_count,
        }}
      />
    </div>
  );

  const mainBlock = (
    <>
      {blindspotHint ? (
        <p className="min-h-[1.25rem] text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Cobertura dominante: {skewLabelEs(blindspotHint.label)} (~
          {blindspotHint.pct}%)
        </p>
      ) : null}
      {isFeatured ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
          Historia destacada
        </p>
      ) : null}
      <h2 className={titleClass}>{h.titulo_canonico}</h2>
      <p className={summaryClass}>
        {h.resumen_canonico?.trim() ? h.resumen_canonico : "\u00A0"}
      </p>
      <div
        className={
          isFeatured
            ? "flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2"
            : "flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-2.5 sm:gap-y-2"
        }
      >
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center">{compareCta}</span>
          <span className="inline-flex rounded-md border border-zinc-200/90 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200">
            {h.medio_count} medios · {h.article_count} artículos
          </span>
        </div>
        {coverageMix ? (
          <div
            className={
              isFeatured
                ? "w-full min-w-0 basis-full pt-0.5 sm:pt-1"
                : "min-w-0 w-full basis-full pl-0 pt-0.5 sm:flex-1 sm:basis-0 sm:pl-2 sm:pt-0"
            }
          >
            <CoverageMixBar
              mix={coverageMix}
              size={isFeatured ? "featured" : "compact"}
              className="min-w-0 w-full"
            />
          </div>
        ) : null}
      </div>
    </>
  );

  const outerClass =
    layout === "split"
      ? isFeatured
        ? "flex w-full flex-col gap-0 px-4 py-3 sm:flex-row sm:items-center sm:justify-start sm:gap-5 sm:px-5 sm:py-5 md:gap-6 md:px-10 md:py-6"
        : "flex w-full flex-col gap-0 px-4 py-3 sm:min-h-[152px] sm:flex-row sm:items-center sm:justify-start sm:gap-4 sm:px-5 sm:py-4"
      : "block";

  const inner = isSplit ? (
    <>
      <Link href={href} className={splitLeftColClass}>
        {mediaBlock}
      </Link>
      <div className={bodySplit}>
        {dateRow}
        <Link
          href={href}
          className={
            isFeatured
              ? "flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4"
              : "flex min-h-0 min-w-0 flex-1 flex-col gap-3"
          }
        >
          {mainBlock}
        </Link>
      </div>
    </>
  ) : (
    <>
      {coverUrl ? (
        <Link href={href} className="block">
          {mediaBlock}
        </Link>
      ) : null}
      <div className={bodyStack}>
        {dateRow}
        <Link
          href={href}
          className={
            isFeatured
              ? "flex flex-col gap-3 sm:gap-4"
              : "flex flex-col gap-3"
          }
        >
          {mainBlock}
        </Link>
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
      <div className={outerClass}>{inner}</div>
    </article>
  );
}
