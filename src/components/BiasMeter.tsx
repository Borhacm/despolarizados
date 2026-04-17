import { sesgoLabelShort } from "@/lib/sesgo";

export function BiasMeter({
  position,
  sesgo,
  caption,
}: {
  position: number;
  /** Etiqueta editorial del medio (p. ej. "centro-derecha"). */
  sesgo?: string;
  /** Texto libre bajo la barra (p. ej. promedios de historia). */
  caption?: string;
}) {
  const p = Math.min(100, Math.max(0, position));
  return (
    <div className="w-full space-y-1.5">
      <div className="grid grid-cols-3 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <span className="text-left">Izquierda</span>
        <span className="text-center">Centro</span>
        <span className="text-right">Derecha</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-rose-200 via-zinc-200 to-sky-300 dark:from-rose-950/50 dark:via-zinc-800 dark:to-sky-950/60">
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-zinc-900 shadow-md dark:border-zinc-900 dark:bg-white"
          style={{ left: `${p}%` }}
        />
      </div>
      {sesgo ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Espectro (orientativo): {sesgoLabelShort(sesgo)}{" "}
          <span className="text-zinc-400">· {sesgo}</span>
        </p>
      ) : caption ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{caption}</p>
      ) : null}
    </div>
  );
}
