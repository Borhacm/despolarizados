"use client";

import { useMemo, useState } from "react";

/**
 * Miniatura OG: siempre misma origen que la página (`/historia/.../opengraph-image`).
 * No usar `NEXT_PUBLIC_APP_URL` aquí: si apunta a otro host, la petición de imagen falla
 * en previews/modales y el mensaje de error era engañoso.
 */
export function HistoriaShareOgPreview({
  historiaId,
  canonicalUrl: _canonicalUrl,
}: {
  historiaId: string;
  canonicalUrl: string;
}) {
  void _canonicalUrl;
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");

  const src = useMemo(
    () => `/historia/${historiaId}/opengraph-image`,
    [historiaId],
  );

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
          <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-1 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>No se pudo cargar la vista previa.</span>
            <span className="text-[10px] text-zinc-400">
              Recarga la página o prueba “Imagen vista previa” más abajo. Si sigue
              fallando, revisa la configuración del servidor (p. ej. Supabase).
            </span>
          </div>
        ) : null}
        {status !== "err" ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={src}
            src={src}
            alt=""
            className={`relative z-0 aspect-[1200/630] h-full w-full object-cover object-center ${
              status === "loading" ? "opacity-0" : "opacity-100"
            }`}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("err")}
          />
        ) : null}
      </div>
    </div>
  );
}
