import {
  visualCoverageConstants,
  visualCoverageLayout,
  type CoverageMix,
} from "@/lib/coverage-mix";

export function CoverageMixBar({
  mix,
  className = "",
  size = "default",
  footnote = true,
}: {
  mix: CoverageMix;
  className?: string;
  size?: "default" | "compact";
  /**
   * Transparencia tipo Ground News (qué mide la barra).
   * `short`: una línea en listados; `true`: texto completo en fichas.
   */
  footnote?: boolean | "short";
}) {
  const { izqPct, centroPct, derPct, izq, centro, der } = mix;
  const n = izq + centro + der;
  const viz = visualCoverageLayout(mix);
  const text =
    size === "compact"
      ? "text-[10px] leading-tight"
      : "text-[11px] leading-tight";
  const footText =
    size === "compact"
      ? "text-[10px] leading-snug text-zinc-500 dark:text-zinc-500"
      : "text-[11px] leading-snug text-zinc-500 dark:text-zinc-400";

  const showFoot =
    footnote === true || footnote === "short";
  const shortFoot = footnote === "short";

  const round = (x: number) => Math.round(x);

  const titleBar = `Visual (desde el centro): izq ${round(viz.labelLeft)}% · centro ${round(viz.labelCenter)}% · der ${round(viz.labelRight)}% (${n} medio(s)). Recuento: ${izqPct}% / ${centroPct}% / ${derPct}%`;

  /** En listados, ancho fijo para que el mismo % tenga siempre la misma longitud en px. */
  const listWrap =
    size === "compact"
      ? "mx-auto w-[288px] max-w-full"
      : "w-full";

  return (
    <div className={`space-y-1 ${listWrap} ${className}`}>
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800/90"
        title={titleBar}
      >
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
        {!viz.hasCenterBand ? (
          <div
            className="pointer-events-none absolute inset-y-0 z-[4] w-px -translate-x-1/2 bg-zinc-600/35 dark:bg-zinc-300/40"
            style={{ left: `${visualCoverageConstants.axisPct}%` }}
            aria-hidden
          />
        ) : null}
      </div>
      <div
        className={`flex flex-wrap justify-between gap-x-2 gap-y-0.5 font-medium tabular-nums text-zinc-500 dark:text-zinc-400 ${text}`}
      >
        <span>
          Izq{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {round(viz.labelLeft)}%
          </span>
        </span>
        <span>
          Centro{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {round(viz.labelCenter)}%
          </span>
        </span>
        <span>
          Der{" "}
          <span className="text-zinc-700 dark:text-zinc-300">
            {round(viz.labelRight)}%
          </span>
        </span>
      </div>
      {showFoot ? (
        <p
          className={`${footText} ${size === "compact" && !shortFoot ? "line-clamp-2" : ""}`}
        >
          {shortFoot ? (
            <>
              {n} medio{n === 1 ? "" : "s"} · relleno desde el 50%: +{visualCoverageConstants.stepPct}%/medio
              izq o der; gris crece con medios de centro (desde {visualCoverageConstants.centerBandMinPct}%)
            </>
          ) : size === "compact" ? (
            <>
              Colores desde el eje central ({visualCoverageConstants.axisPct}%): izq/der hacia los lados; franja gris
              centrada si hay medios de centro. Abajo, anchos visuales; recuento: {izqPct}% / {centroPct}% / {derPct}%.
            </>
          ) : (
            <>
              La barra se rellena{" "}
              <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                desde el centro (50%)
              </strong>{" "}
              hacia cada lado: cada medio de izquierda suma{" "}
              {visualCoverageConstants.stepPct}% hacia la izquierda desde el eje; cada
              medio de derecha, {visualCoverageConstants.stepPct}% hacia la derecha. Los
              medios de centro generan una franja gris simétrica alrededor del eje (más
              medios de centro la ensanchan, hasta un máximo). Recuento de medios:{" "}
              <span className="tabular-nums">
                {izqPct}% / {centroPct}% / {derPct}%
              </span>
              ; los tres valores bajo la barra son anchos de color visibles.
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
