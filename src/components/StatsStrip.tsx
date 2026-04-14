import type { CatalogStats } from "@/lib/db-stats";

export function StatsStrip({ stats }: { stats: CatalogStats }) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
        <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {stats.medios}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Medios
        </p>
      </div>
      <div className="rounded-xl border border-emerald-200/90 bg-white px-4 py-3 text-center shadow-sm ring-1 ring-emerald-100/70 dark:border-emerald-900/45 dark:bg-zinc-950/50 dark:ring-emerald-950/25">
        <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {stats.historias}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Historias
        </p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
        <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {stats.articulos}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Artículos
        </p>
      </div>
    </div>
  );
}
