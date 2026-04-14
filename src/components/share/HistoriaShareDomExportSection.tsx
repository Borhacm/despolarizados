"use client";

import { HistoriaShareCardDom } from "@/components/share/HistoriaShareCardDom";
import { captureShareCardDomToPng } from "@/lib/share/capture-share-card-dom";
import type { HistoriaShareVisualPayload } from "@/lib/share/historia-share-visual";
import { historiaInstagramCaption } from "@/lib/share/historia-share-copy";
import { sharePngBlobWithWebShareOrDownload } from "@/lib/share/web-share-png-blob";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { useCallback, useRef, useState } from "react";

type Props = {
  historiaId: string;
  title: string;
  url: string;
  hostLabel: string;
  visual: HistoriaShareVisualPayload;
  variant: "bar" | "modal";
  onFeedback: (msg: string) => void;
  onError: (msg: string | null) => void;
};

export function HistoriaShareDomExportSection({
  historiaId,
  title,
  url,
  hostLabel,
  visual,
  variant,
  onFeedback,
  onError,
}: Props) {
  const refStory = useRef<HTMLDivElement>(null);
  const refOg = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"story" | "og" | null>(null);

  const btnClass =
    variant === "modal"
      ? "inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-emerald-400/80 hover:bg-emerald-50/50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-600 sm:col-span-2"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-emerald-400/80 hover:bg-emerald-50/50 disabled:opacity-60 sm:min-h-0 sm:py-1.5 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-emerald-600";

  const runCapture = useCallback(
    async (mode: "story" | "og") => {
      const node = mode === "story" ? refStory.current : refOg.current;
      if (!node) {
        onError("No se pudo preparar la tarjeta para exportar.");
        return;
      }
      setBusy(mode);
      onError(null);
      try {
        const pixelRatio = mode === "story" ? 2 : 2;
        const blob = await captureShareCardDomToPng(node, { pixelRatio });
        const short = historiaId.slice(0, 8);
        const name =
          mode === "story"
            ? `despolarizados-dom-story-${short}.png`
            : `despolarizados-dom-og-${short}.png`;
        const caption = historiaInstagramCaption(title, url);
        const result = await sharePngBlobWithWebShareOrDownload({
          blob,
          fileName: name,
          title,
          caption,
          url,
          copyUrlToClipboard: async () => {
            if (copyTextToClipboard(url)) return true;
            try {
              await navigator.clipboard.writeText(url);
              return true;
            } catch {
              return false;
            }
          },
        });
        if (result === "shared") {
          onFeedback("Imagen lista: si no ves Instagram, elige la app en el menú.");
        } else if (result === "downloaded") {
          onFeedback("PNG descargado (la imagen remota pudo no mostrarse si bloquea CORS).");
        }
      } catch {
        onError(
          "No se pudo generar el PNG. Prueba la imagen del servidor o revisa CORS de la foto.",
        );
      } finally {
        setBusy(null);
      }
    },
    [historiaId, onError, onFeedback, title, url],
  );

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 -left-[14000px] z-0 flex gap-8"
        aria-hidden
      >
        <HistoriaShareCardDom
          ref={refStory}
          title={title}
          hostLabel={hostLabel}
          visual={visual}
          variant="story"
        />
        <HistoriaShareCardDom
          ref={refOg}
          title={title}
          hostLabel={hostLabel}
          visual={visual}
          variant="og"
        />
      </div>

      <div
        className={`rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3 py-3 dark:border-zinc-700/80 dark:bg-zinc-950/35 ${variant === "modal" ? "space-y-2" : "space-y-2"}`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Si la portada falla (CORS)
        </p>
        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          PNG desde el navegador. Si la foto remota no carga, usa las imágenes del
          servidor arriba.
        </p>
        <div
          className={
            variant === "modal"
              ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
              : "flex flex-wrap items-center justify-end gap-2"
          }
        >
          <button
            type="button"
            className={btnClass}
            disabled={busy !== null}
            onClick={() => void runCapture("story")}
          >
            {busy === "story" ? "Generando…" : "PNG 9:16 (DOM)"}
          </button>
          <button
            type="button"
            className={btnClass}
            disabled={busy !== null}
            onClick={() => void runCapture("og")}
          >
            {busy === "og" ? "Generando…" : "PNG 1.91:1 (DOM)"}
          </button>
        </div>
      </div>
    </>
  );
}
