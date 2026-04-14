"use client";

/**
 * Muestra la misma imagen que genera `opengraph-image` (servidor).
 * No duplica el card de la ficha: es solo vista previa del asset social.
 */
export function HistoriaShareOgPreview({
  historiaId,
  canonicalUrl,
}: {
  historiaId: string;
  canonicalUrl: string;
}) {
  let origin = "";
  try {
    origin = new URL(canonicalUrl).origin;
  } catch {
    if (typeof window !== "undefined") origin = window.location.origin;
  }
  const src = `${origin}/historia/${historiaId}/opengraph-image`;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-900/50">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="aspect-[1200/630] w-full object-cover"
        loading="eager"
        decoding="async"
      />
      <p className="border-t border-zinc-200/80 px-3 py-2 text-[11px] leading-snug text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Vista previa que suelen mostrar WhatsApp, X u otras apps al compartir el
        enlace (Open Graph). No es la imagen del listado de la ficha.
      </p>
    </div>
  );
}
