"use client";

import { useMemo, useState } from "react";

/**
 * Miniatura de la imagen OG del servidor (misma ruta que crawlers).
 * Usa ruta relativa si el enlace canónico coincide con el origen actual.
 */
export function HistoriaShareOgPreview({
  historiaId,
  canonicalUrl,
}: {
  historiaId: string;
  canonicalUrl: string;
}) {
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");

  const src = useMemo(() => {
    const path = `/historia/${historiaId}/opengraph-image`;
    if (typeof window === "undefined") {
      try {
        return new URL(path, canonicalUrl).toString();
      } catch {
        return path;
      }
    }
    try {
      const o = new URL(canonicalUrl).origin;
      if (o === window.location.origin) return path;
      return `${o}${path}`;
    } catch {
      return path;
    }
  }, [canonicalUrl, historiaId]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-900/50">
      <div className="relative aspect-[1200/630] w-full bg-zinc-200/90 dark:bg-zinc-800/80">
        {status === "loading" ? (
          <div
            className="absolute inset-0 z-[1] animate-pulse bg-zinc-200/80 dark:bg-zinc-800/80"
            aria-hidden
          />
        ) : null}
        {status === "err" ? (
          <div className="absolute inset-0 z-[1] flex items-center justify-center px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            No se pudo cargar la vista previa. Usa “Obtener PNG” debajo.
          </div>
        ) : null}
        {status !== "err" ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt=""
            className={`aspect-[1200/630] h-full w-full object-cover ${status === "loading" ? "opacity-0" : "opacity-100"}`}
            loading="eager"
            decoding="async"
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("err")}
          />
        ) : null}
      </div>
      <p className="border-t border-zinc-200/80 px-3 py-2 text-[11px] leading-snug text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Vista previa al compartir el enlace (Open Graph).
      </p>
    </div>
  );
}
