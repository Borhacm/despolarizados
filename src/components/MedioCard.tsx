import { BiasMeter } from "@/components/BiasMeter";
import { getMedioInitials } from "@/lib/medio-display";
import { sesgoEsCentro, sesgoToPosition } from "@/lib/sesgo";
import Link from "next/link";

type Medio = {
  id: string;
  nombre: string;
  slug: string;
  rss_urls: string[] | null;
  sesgo: string;
  factualidad: string;
  ownership: string | null;
};

export function MedioCard({ m }: { m: Medio }) {
  const initials = getMedioInitials(m.nombre);
  const pos = sesgoToPosition(m.sesgo);
  const esCentro = sesgoEsCentro(m.sesgo);
  const hue = esCentro
    ? "from-zinc-300/95 to-zinc-500/85 dark:from-zinc-600/90 dark:to-zinc-800/90"
    : pos < 40
      ? "from-rose-400/90 to-rose-600/80"
      : pos > 60
        ? "from-sky-400/90 to-sky-600/80"
        : "from-teal-400/90 to-emerald-600/80";

  const cardHover = esCentro
    ? "hover:border-zinc-300/90 hover:shadow-md dark:hover:border-zinc-600/50"
    : "hover:border-emerald-200/90 hover:shadow-md dark:hover:border-emerald-800/45";

  const titleGroupHover = esCentro
    ? "group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
    : "group-hover:text-emerald-800 dark:group-hover:text-emerald-300";

  return (
    <Link
      href={`/medios/${m.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm no-underline outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950/50 dark:focus-visible:ring-emerald-400/60 dark:focus-visible:ring-offset-zinc-950 ${cardHover}`}
    >
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
            <h2
              className={`text-lg font-semibold leading-snug text-zinc-900 transition dark:text-zinc-50 ${titleGroupHover}`}
            >
              {m.nombre}
            </h2>
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

        <div className="mt-auto mb-4">
          <BiasMeter position={pos} sesgo={m.sesgo} />
        </div>
      </div>
    </Link>
  );
}
