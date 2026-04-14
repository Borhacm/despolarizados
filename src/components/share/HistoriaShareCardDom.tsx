"use client";

import { CoverageMixBar } from "@/components/CoverageMixBar";
import type { HistoriaShareVisualPayload } from "@/lib/share/historia-share-visual";
import { forwardRef, useState } from "react";

export type HistoriaShareCardDomProps = {
  title: string;
  hostLabel: string;
  visual: HistoriaShareVisualPayload;
  /** story = 9:16; og = 1.91:1 aprox. */
  variant: "story" | "og";
  className?: string;
};

function CoverBlock({
  url,
  variant,
}: {
  url: string | null;
  variant: "story" | "og";
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !url || failed;

  const storyShell =
    variant === "story"
      ? "flex h-[55%] min-h-0 items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 px-6"
      : "flex h-full w-[46%] min-w-[46%] items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950";

  return (
    <div className={storyShell}>
      {showPlaceholder ? (
        <div
          className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-950 to-zinc-950 font-black text-emerald-400 shadow-xl ${
            variant === "story"
              ? "aspect-square w-full max-w-[min(100%,420px)] text-[120px] leading-none"
              : "h-[min(100%,260px)] w-[min(100%,260px)] text-[100px] leading-none"
          }`}
        >
          D
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          crossOrigin="anonymous"
          className={
            variant === "story"
              ? "max-h-full max-w-full rounded-lg object-cover shadow-2xl"
              : "h-full max-h-[280px] w-full max-w-[280px] rounded-lg object-cover shadow-2xl"
          }
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

/**
 * Tarjeta editorial para captura en cliente (html-to-image).
 * No sustituye al card de la ficha; solo comparte layout semántico con OG/Story del servidor.
 */
export const HistoriaShareCardDom = forwardRef<HTMLDivElement, HistoriaShareCardDomProps>(
  function HistoriaShareCardDom(
    { title, hostLabel, visual, variant, className = "" },
    ref,
  ) {
    const subtitle = `${visual.medioCount} medios · ${visual.articleCount} artículos`;
    const lineClamp =
      variant === "story"
        ? "line-clamp-6 text-2xl font-bold leading-tight tracking-tight"
        : "line-clamp-4 text-xl font-bold leading-snug tracking-tight sm:text-2xl";

    if (variant === "story") {
      return (
        <div
          ref={ref}
          className={`flex w-[540px] flex-col overflow-hidden rounded-none bg-[#0a0a0a] text-zinc-50 ${className}`}
          style={{ height: 960 }}
        >
          <CoverBlock url={visual.coverImageUrl} variant="story" />
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 px-8 pb-10 pt-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-emerald-400">
                  Despolarizados
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Comparativa
                </span>
              </div>
              <p className="text-sm font-semibold text-zinc-400">{subtitle}</p>
              <p className={`${lineClamp} text-balance text-zinc-50`}>{title}</p>
            </div>
            {visual.mix ? (
              <CoverageMixBar mix={visual.mix} size="featured" />
            ) : (
              <p className="text-sm text-zinc-500">
                Comparativa en <span className="text-emerald-400">{hostLabel}</span>
              </p>
            )}
            <div className="flex flex-wrap items-end justify-between gap-2 border-t border-zinc-800 pt-4 text-sm">
              <span className="max-w-[70%] text-zinc-500">
                Enlace en leyenda — abre la comparativa completa
              </span>
              <span className="font-bold text-emerald-400">{hostLabel}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`flex h-[315px] w-[600px] flex-row overflow-hidden bg-[#0a0a0a] text-zinc-50 ${className}`}
      >
        <CoverBlock url={visual.coverImageUrl} variant="og" />
        <div className="flex min-h-0 flex-1 flex-col justify-between py-6 pr-6 pl-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-extrabold tracking-tight text-emerald-400">
                Despolarizados
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Comparativa
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-400">{subtitle}</p>
            <p className={`${lineClamp} text-balance text-zinc-50`}>{title}</p>
          </div>
          <div className="space-y-2">
            {visual.mix ? (
              <CoverageMixBar mix={visual.mix} size="compact" />
            ) : (
              <p className="text-xs text-zinc-500">Más en {hostLabel}</p>
            )}
            <div className="flex items-end justify-between gap-2 text-[11px] text-zinc-500">
              <span className="max-w-[70%]">Abre el enlace para titulares y medios</span>
              <span className="font-bold text-emerald-400">{hostLabel}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
