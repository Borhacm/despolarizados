import Link from "next/link";
import type { TrendTerm } from "@/lib/trending-keywords";

export function TrendingChips({
  terms,
  queryBase = "/",
}: {
  terms: TrendTerm[];
  /** Ruta base para búsqueda (`/` o `/feed`). */
  queryBase?: string;
}) {
  if (terms.length === 0) return null;
  const base = queryBase.endsWith("/") ? queryBase.slice(0, -1) : queryBase;
  return (
    <section className="mb-8 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-white to-zinc-50/90 px-4 py-5 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/25 dark:via-zinc-950/40 dark:to-zinc-950/80 sm:px-6">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          aria-hidden
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 17h4l3-8 4 10 3-6h4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300/95">
            Tendencias
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Temas que concentran varios titulares ahora. Pulsa para buscar en la
            lista.
          </p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2">
        {terms.map((term, i) => (
          <li key={`${term.q}-${i}`}>
            <Link
              href={`${base}?q=${encodeURIComponent(term.q)}`}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/90 px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-950 dark:border-emerald-800/60 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-emerald-500/70 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-50"
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-[10px] font-bold tabular-nums text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                aria-hidden
              >
                {i + 1}
              </span>
              <span>{term.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
