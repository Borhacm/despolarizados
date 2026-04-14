import Link from "next/link";

export function TrendingChips({
  terms,
  queryBase = "/",
}: {
  terms: string[];
  /** Ruta base para búsqueda (`/` o `/feed`). */
  queryBase?: string;
}) {
  if (terms.length === 0) return null;
  const base = queryBase.endsWith("/") ? queryBase.slice(0, -1) : queryBase;
  return (
    <section className="mb-8 border-b border-zinc-200/90 pb-8 dark:border-zinc-800/90">
      <div className="mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Tendencias
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
          Temas que repiten varios titulares y no son palabras vacías (preposiciones,
          plantillas de portada, etc.).
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {terms.map((w) => (
          <Link
            key={w}
            href={`${base}?q=${encodeURIComponent(w)}`}
            className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/90 hover:text-emerald-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/35 dark:hover:text-emerald-100"
          >
            {w}
          </Link>
        ))}
      </div>
    </section>
  );
}
