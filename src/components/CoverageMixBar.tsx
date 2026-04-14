import type { CoverageMix } from "@/lib/coverage-mix";

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

  return (
    <div className={`space-y-1 ${className}`}>
      <div
        className="flex h-2 w-full overflow-hidden rounded-full"
        title={`Izquierda ${izqPct}% · Centro ${centroPct}% · Derecha ${derPct}% · ${n} medio(s) en la historia`}
      >
        <div
          className="bg-rose-500/90 dark:bg-rose-600/90"
          style={{ width: `${izqPct}%` }}
        />
        <div
          className="bg-zinc-300 dark:bg-zinc-600"
          style={{ width: `${centroPct}%` }}
        />
        <div
          className="bg-sky-500/90 dark:bg-sky-500/85"
          style={{ width: `${derPct}%` }}
        />
      </div>
      <div
        className={`flex flex-wrap justify-between gap-x-2 gap-y-0.5 font-medium tabular-nums text-zinc-500 dark:text-zinc-400 ${text}`}
      >
        <span>
          Izq <span className="text-zinc-700 dark:text-zinc-300">{izqPct}%</span>
        </span>
        <span>
          Centro{" "}
          <span className="text-zinc-700 dark:text-zinc-300">{centroPct}%</span>
        </span>
        <span>
          Der{" "}
          <span className="text-zinc-700 dark:text-zinc-300">{derPct}%</span>
        </span>
      </div>
      {showFoot ? (
        <p
          className={`${footText} ${size === "compact" && !shortFoot ? "line-clamp-2" : ""}`}
        >
          {shortFoot ? (
            <>
              {n} medio{n === 1 ? "" : "s"} · % según etiqueta en el catálogo (no
              el titular)
              {n < 4 ? " · muestra pequeña" : ""}
            </>
          ) : size === "compact" ? (
            <>
              % = reparto de{" "}
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {n} medio{n === 1 ? "" : "s"}
              </span>{" "}
              según etiqueta en el catálogo, no el sesgo del titular.
              {n < 4 ? (
                <>
                  {" "}
                  <span className="text-zinc-600 dark:text-zinc-500">
                    Pocas fuentes → porcentajes muy extremos.
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <>
              Los porcentajes cuentan cada medio una vez según su orientación en
              el catálogo (orientativa). Indican{" "}
              <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                quién cubre
              </strong>{" "}
              la historia, no un juicio sobre el contenido. Con{" "}
              {n} fuente{n === 1 ? "" : "s"}, la barra es más ilustrativa que
              estadística{n < 4 ? " (muestra pequeña)." : "."}
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
