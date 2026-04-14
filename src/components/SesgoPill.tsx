import { sesgoLabelShort } from "@/lib/sesgo";

/** Pastilla Izq / Centro / Der al estilo Ground News. */
export function SesgoPill({ sesgo }: { sesgo: string }) {
  const short = sesgoLabelShort(sesgo);
  const p = short.toLowerCase();
  const cls =
    p === "izquierda"
      ? "bg-rose-100 text-rose-900 ring-rose-200/80 dark:bg-rose-950/60 dark:text-rose-100 dark:ring-rose-800"
      : p === "derecha"
        ? "bg-sky-100 text-sky-950 ring-sky-200/80 dark:bg-sky-950/50 dark:text-sky-100 dark:ring-sky-800"
        : "bg-zinc-200 text-zinc-800 ring-zinc-300/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-600";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${cls}`}
    >
      {short}
    </span>
  );
}
