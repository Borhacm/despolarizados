import { BiasMeter } from "@/components/BiasMeter";
import { getMedioInitials } from "@/lib/medio-display";
import { sesgoToPosition } from "@/lib/sesgo";
import Link from "next/link";

type Medio = {
  id: string;
  nombre: string;
  slug: string;
  rss_urls: string[] | null;
  sesgo: string;
  factualidad: string;
  ownership: string | null;
  prioridad: number;
};

export function MedioCard({ m }: { m: Medio }) {
  const initials = getMedioInitials(m.nombre);
  const pos = sesgoToPosition(m.sesgo);
  const hue =
    pos < 40 ? "from-rose-400/90 to-rose-600/80" : pos > 60 ? "from-sky-400/90 to-sky-600/80" : "from-teal-400/90 to-emerald-600/80";

  const feeds = m.rss_urls?.length ?? 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm transition hover:border-emerald-200/90 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-emerald-800/45">
      <div
        className={`h-1.5 w-full bg-gradient-to-r ${hue}`}
        aria-hidden
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 text-lg font-bold tracking-tight text-zinc-700 shadow-inner dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-200"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                <Link
                  href={`/medios/${m.slug}`}
                  className="hover:text-emerald-800 dark:hover:text-emerald-300"
                >
                  {m.nombre}
                </Link>
              </h2>
              <span
                className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                title="Prioridad de ingesta (1–5)"
              >
                P{m.prioridad}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {m.ownership ?? "Propiedad no indicada"}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            Sesgo: {m.sesgo}
          </span>
          <span className="inline-flex items-center rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
            Factualidad: {m.factualidad}
          </span>
        </div>

        <div className="mb-4">
          <BiasMeter position={pos} sesgo={m.sesgo} />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
          <span className="text-xs text-zinc-500">
            {feeds} feed{feeds === 1 ? "" : "s"} RSS
          </span>
          <Link
            href={`/medios/${m.slug}`}
            className="text-sm font-semibold text-emerald-700 transition group-hover:gap-1 dark:text-emerald-300"
          >
            Ver ficha →
          </Link>
        </div>
      </div>
    </article>
  );
}
