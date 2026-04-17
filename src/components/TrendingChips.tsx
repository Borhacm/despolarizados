import Link from "next/link";
import { DisclosureChevron } from "@/components/DisclosureChevron";
import {
  SectionHeaderIconBox,
  TrendingSparkGlyph,
} from "@/components/SectionHeaderGlyph";
import type { TrendTerm } from "@/lib/trending-keywords";

const chipLinkClass =
  "inline-flex min-h-[44px] max-w-full min-w-0 items-center gap-2 rounded-full border border-emerald-200/90 bg-white/90 px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-950 sm:min-h-0 dark:border-emerald-800/60 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-emerald-500/70 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-50";

const cardClass =
  "mb-8 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-white to-zinc-50/90 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/25 dark:via-zinc-950/40 dark:to-zinc-950/80";

export function TrendingChips({
  terms,
  queryBase = "/",
  collapsible = false,
  defaultOpen = false,
}: {
  terms: TrendTerm[];
  /** Ruta base para búsqueda (`/` o `/feed`). */
  queryBase?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  if (terms.length === 0) return null;
  const base = queryBase.endsWith("/") ? queryBase.slice(0, -1) : queryBase;

  const chipList = (
    <ul className="flex flex-wrap gap-2">
      {terms.map((term, i) => (
        <li key={`${term.q}-${i}`} className="min-w-0 max-w-full">
          <Link
            href={`${base}?q=${encodeURIComponent(term.q)}`}
            className={chipLinkClass}
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-[10px] font-bold tabular-nums text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
              aria-hidden
            >
              {i + 1}
            </span>
            <span className="min-w-0 break-words text-left leading-snug">
              {term.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const headingBlock = (
    <>
      <SectionHeaderIconBox>
        <TrendingSparkGlyph />
      </SectionHeaderIconBox>
      <div className="min-w-0 flex-1">
        <h2
          id="trending-heading"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300/95"
        >
          Tendencias
        </h2>
        <p className="mt-1 hidden text-sm leading-relaxed text-zinc-600 sm:block dark:text-zinc-400">
          Temas que concentran varios titulares ahora. Pulsa para buscar en la
          lista.
        </p>
      </div>
    </>
  );

  if (collapsible) {
    return (
      <details
        className={`group ${cardClass} overflow-hidden`}
        aria-labelledby="trending-heading"
        {...(defaultOpen ? { open: true } : {})}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {headingBlock}
          </div>
          <DisclosureChevron className="h-5 w-5 shrink-0 text-emerald-700 transition-transform duration-200 group-open:rotate-180 dark:text-emerald-300" />
        </summary>
        <div className="border-t border-emerald-200/50 px-4 pb-4 pt-0 dark:border-emerald-900/35 sm:px-6">
          {chipList}
        </div>
      </details>
    );
  }

  return (
    <section className={`${cardClass} px-4 py-5 sm:px-6`}>
      <div className="mb-4 flex flex-wrap items-center gap-3">{headingBlock}</div>
      {chipList}
    </section>
  );
}
