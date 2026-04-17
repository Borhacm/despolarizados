import Link from "next/link";

export function PaginationBar({
  page,
  hasMore,
  query,
  pathname = "/",
}: {
  page: number;
  hasMore: boolean;
  query: Record<string, string>;
  pathname?: string;
}) {
  function href(p: number): string {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v.length) u.set(k, v);
    }
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    if (!s.length) return pathname;
    return `${pathname}?${s}`;
  }

  return (
    <nav
      className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-zinc-200/90 bg-[var(--surface)] px-4 py-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/40"
      aria-label="Paginación"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
        >
          ← Anterior
        </Link>
      ) : (
        <span
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200/60 px-4 py-2 text-sm text-zinc-400 dark:border-zinc-700/80 dark:text-zinc-500"
          aria-disabled
        >
          ← Anterior
        </span>
      )}
      <span className="min-w-[7rem] text-center text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
        Página {page}
      </span>
      {hasMore ? (
        <Link
          href={href(page + 1)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
        >
          Siguiente →
        </Link>
      ) : (
        <span
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200/60 px-4 py-2 text-sm text-zinc-400 dark:border-zinc-700/80 dark:text-zinc-500"
          aria-disabled
        >
          Siguiente →
        </span>
      )}
    </nav>
  );
}
