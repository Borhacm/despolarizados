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

  if (page <= 1 && !hasMore) return null;

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-4"
      aria-label="Paginación"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="rounded-xl border border-transparent px-4 py-2 text-sm text-zinc-400">
          ← Anterior
        </span>
      )}
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Página {page}
      </span>
      {hasMore ? (
        <Link
          href={href(page + 1)}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50/80 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
        >
          Siguiente →
        </Link>
      ) : (
        <span className="rounded-xl border border-transparent px-4 py-2 text-sm text-zinc-400">
          Siguiente →
        </span>
      )}
    </nav>
  );
}
