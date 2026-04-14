import {
  visualCoverageStacked,
  type CoverageMix,
} from "@/lib/coverage-mix";

export function CoverageMixBar({
  mix,
  className = "",
  size = "default",
}: {
  mix: CoverageMix;
  className?: string;
  /** `compact`: listados; `featured`: portada (móvil: barra más alta y legible). */
  size?: "default" | "compact" | "featured";
}) {
  const { izqPct, centroPct, derPct, izq, centro, der } = mix;
  const n = izq + centro + der;
  const viz = visualCoverageStacked(mix);
  const text =
    size === "compact"
      ? "text-[10px] leading-tight"
      : size === "featured"
        ? "text-xs leading-snug sm:text-[11px] sm:leading-tight"
        : "text-[11px] leading-tight";

  const round = (x: number) => Math.round(x);

  const titleBar = `Cobertura (${n} ${n === 1 ? "noticia" : "noticias"}): ${round(izqPct)}% izquierda, ${round(centroPct)}% centro, ${round(derPct)}% derecha`;

  const listWrap = "w-full min-w-0";

  const trackClass =
    size === "featured"
      ? "relative h-4 w-full overflow-hidden rounded-full bg-zinc-200 ring-1 ring-inset ring-zinc-400/35 dark:bg-zinc-800 dark:ring-zinc-500/40 sm:h-3 sm:ring-0"
      : "relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800/90";

  return (
    <div
      className={`${size === "featured" ? "space-y-1.5 sm:space-y-1" : "space-y-1"} ${listWrap} ${className}`}
    >
      <div className={trackClass} title={titleBar}>
        {viz.left ? (
          <div
            className="absolute inset-y-0 z-[2] bg-rose-500/90 dark:bg-rose-600/90"
            style={{
              left: `${viz.left.left}%`,
              width: `${viz.left.width}%`,
            }}
          />
        ) : null}
        {viz.center ? (
          <div
            className="absolute inset-y-0 z-[3] bg-zinc-400 dark:bg-zinc-500"
            style={{
              left: `${viz.center.left}%`,
              width: `${viz.center.width}%`,
            }}
          />
        ) : null}
        {viz.right ? (
          <div
            className="absolute inset-y-0 z-[2] bg-sky-500/90 dark:bg-sky-500/85"
            style={{
              left: `${viz.right.left}%`,
              width: `${viz.right.width}%`,
            }}
          />
        ) : null}
      </div>
      <div
        className={`flex w-full flex-wrap justify-between gap-x-1 gap-y-0.5 font-medium tabular-nums text-zinc-500 dark:text-zinc-400 ${text}`}
      >
        <span className={size === "featured" ? "min-w-0" : undefined}>
          Izq{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {round(izqPct)}%
          </span>
        </span>
        <span className={size === "featured" ? "min-w-0" : undefined}>
          Centro{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {round(centroPct)}%
          </span>
        </span>
        <span className={size === "featured" ? "min-w-0" : undefined}>
          Der{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {round(derPct)}%
          </span>
        </span>
      </div>
    </div>
  );
}
