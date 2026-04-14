"use client";

import { HistoriaShareOgPreview } from "@/components/share/HistoriaShareOgPreview";
import { HistoriaShareDomExportSection } from "@/components/share/HistoriaShareDomExportSection";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import {
  historiaInstagramCaption,
  historiaShareSnippet,
} from "@/lib/share/historia-share-copy";
import type { HistoriaShareVisualPayload } from "@/lib/share/historia-share-visual";
import { isMobileShareContext } from "@/lib/share/mobile-instagram-share";
import {
  buildFacebookShareUrl,
  buildLinkedInShareUrl,
  buildRedditSubmitUrl,
  buildTwitterIntentUrl,
  buildWhatsAppShareUrl,
} from "@/lib/share/social-share-urls";
import { sharePngBlobWithWebShareOrDownload } from "@/lib/share/web-share-png-blob";
import { useCallback, useEffect, useMemo, useState } from "react";

export type HistoriaShareOptionsProps = {
  historiaId: string;
  title: string;
  /** URL canónica absoluta de la historia */
  url: string;
  /** Barra horizontal (ficha) o rejilla amplia (modal en card). */
  variant?: "bar" | "modal";
  /** Datos para export DOM (html-to-image); si falta, se oculta esa sección. */
  visual?: HistoriaShareVisualPayload | null;
};

function assetOrigin(canonicalUrl: string): string {
  try {
    return new URL(canonicalUrl).origin;
  } catch {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }
}

export function HistoriaShareOptions({
  historiaId,
  title,
  url,
  variant = "bar",
  visual = null,
}: HistoriaShareOptionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showIgManual, setShowIgManual] = useState(false);
  const [ogBusy, setOgBusy] = useState(false);
  const [storyBusy, setStoryBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileUi, setMobileUi] = useState(false);

  useEffect(() => {
    setMobileUi(isMobileShareContext());
  }, []);

  const snippet = historiaShareSnippet(title);
  const igCaption = historiaInstagramCaption(title, url);
  const base = useMemo(() => assetOrigin(url), [url]);

  const hostLabel = useMemo(() => {
    try {
      return new URL(url).host;
    } catch {
      return "";
    }
  }, [url]);

  const ogImageSrc = `${base}/historia/${historiaId}/opengraph-image`;
  const storyImagePath = `${base}/historia/${historiaId}/story-image`;

  const links = useMemo(
    () => [
      { label: "X", href: buildTwitterIntentUrl(url, title) },
      { label: "WhatsApp", href: buildWhatsAppShareUrl(title, url) },
      { label: "LinkedIn", href: buildLinkedInShareUrl(url) },
      { label: "Facebook", href: buildFacebookShareUrl(url) },
      { label: "Reddit", href: buildRedditSubmitUrl(url, title) },
    ],
    [title, url],
  );

  const flash = useCallback((msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 2800);
  }, []);

  const copyUrlToClipboardAsync = useCallback(async (): Promise<boolean> => {
    if (copyTextToClipboard(url)) return true;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  const onCopyUrl = useCallback(() => {
    setShowIgManual(false);
    setError(null);
    void copyUrlToClipboardAsync().then((ok) => {
      if (ok) flash("Enlace copiado al portapapeles.");
      else window.prompt("Copia el enlace:", url);
    });
  }, [copyUrlToClipboardAsync, flash, url]);

  const onCopyInstagramCaption = useCallback(() => {
    setShowIgManual(false);
    setError(null);

    const fallback = () => {
      if (copyTextToClipboard(igCaption)) {
        flash("Texto copiado. Pégalo en Instagram como leyenda.");
        return;
      }
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(igCaption).then(
          () => flash("Texto copiado. Pégalo en Instagram como leyenda."),
          () => setShowIgManual(true),
        );
        return;
      }
      setShowIgManual(true);
    };

    fallback();
  }, [flash, igCaption]);

  const fetchPng = useCallback(async (path: string) => {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo generar la imagen.");
    return res.blob();
  }, []);

  const onShareOgPng = useCallback(async () => {
    setOgBusy(true);
    setError(null);
    try {
      const blob = await fetchPng(ogImageSrc);
      const name = `despolarizados-og-${historiaId.slice(0, 8)}.png`;
      const result = await sharePngBlobWithWebShareOrDownload({
        blob,
        fileName: name,
        title,
        caption: snippet,
        url,
        copyUrlToClipboard: copyUrlToClipboardAsync,
      });
      if (result === "shared") {
        flash("Listo: elige la app en el menú de compartir si hace falta.");
      } else if (result === "downloaded") {
        flash("PNG descargado.");
      }
    } catch {
      setError("No se pudo obtener la imagen de vista previa.");
    } finally {
      setOgBusy(false);
    }
  }, [
    copyUrlToClipboardAsync,
    fetchPng,
    flash,
    historiaId,
    ogImageSrc,
    snippet,
    title,
    url,
  ]);

  const onStoryImage = useCallback(async () => {
    setStoryBusy(true);
    setError(null);
    try {
      const blob = await fetchPng(storyImagePath);
      const name = `despolarizados-stories-${historiaId.slice(0, 8)}.png`;
      const caption = historiaInstagramCaption(title, url);
      const result = await sharePngBlobWithWebShareOrDownload({
        blob,
        fileName: name,
        title,
        caption,
        url,
        copyUrlToClipboard: copyUrlToClipboardAsync,
      });
      if (result === "shared") {
        flash(
          mobileUi
            ? "Enlace copiado. En el menú, elige Instagram (Historia o feed) si aparece."
            : "Enlace copiado. Elige la app en el menú de compartir.",
        );
      } else if (result === "downloaded") {
        flash(
          "PNG descargado. El enlace debería estar en el portapapeles.",
        );
      }
    } catch {
      setError("No se pudo preparar la imagen para Stories.");
    } finally {
      setStoryBusy(false);
    }
  }, [
    copyUrlToClipboardAsync,
    fetchPng,
    flash,
    historiaId,
    mobileUi,
    storyImagePath,
    title,
    url,
  ]);

  const onNativeShare = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      onCopyUrl();
      return;
    }
    setShareBusy(true);
    setError(null);
    try {
      await navigator.share({
        title: title.length > 120 ? `${title.slice(0, 117)}…` : title,
        text: snippet,
        url,
      });
    } catch (e) {
      const err = e as { name?: string };
      if (err?.name === "AbortError") return;
      onCopyUrl();
    } finally {
      setShareBusy(false);
    }
  }, [onCopyUrl, snippet, title, url]);

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const btnClass =
    variant === "modal"
      ? "inline-flex min-h-[2.5rem] items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 sm:min-h-0 sm:py-1.5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-emerald-700 dark:hover:text-emerald-300";

  const secondaryClass =
    variant === "modal"
      ? "inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-600 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/80 hover:text-emerald-900 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/40 sm:col-span-2"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/90 px-3 py-2 text-xs font-semibold text-zinc-600 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/80 hover:text-emerald-900 disabled:opacity-60 sm:min-h-0 sm:py-1.5 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/40";

  const igMutedClass =
    variant === "modal"
      ? "inline-flex min-h-[2.5rem] items-center justify-center rounded-xl border border-violet-200/90 bg-violet-50/90 px-3 py-2 text-sm font-semibold text-violet-950 shadow-sm transition hover:border-violet-400 hover:bg-violet-100/80 disabled:opacity-60 dark:border-violet-800/80 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:border-violet-500"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-violet-200/90 bg-violet-50/90 px-3 py-2 text-xs font-semibold text-violet-950 shadow-sm transition hover:border-violet-400 hover:bg-violet-100/80 disabled:opacity-60 sm:min-h-0 sm:py-1.5 dark:border-violet-800/80 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:border-violet-500";

  const wrapClass =
    variant === "modal"
      ? "grid grid-cols-2 gap-2 sm:grid-cols-3"
      : "flex flex-wrap items-center justify-end gap-2";

  const igWrapClass =
    variant === "modal"
      ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
      : "flex flex-wrap items-center justify-end gap-2";

  const storyButtonLabel = mobileUi
    ? "Imagen Stories / Instagram"
    : "Imagen Stories (9:16)";

  return (
    <div className="space-y-3">
      {variant === "modal" ? (
        <HistoriaShareOgPreview historiaId={historiaId} canonicalUrl={url} />
      ) : null}

      {feedback ? (
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
          {feedback}
        </p>
      ) : null}

      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {showIgManual ? (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="mb-2 text-xs font-medium text-amber-950 dark:text-amber-100">
            No se pudo copiar automáticamente. Selecciona el texto y pulsa copiar
            (o Cmd+C / Ctrl+C).
          </p>
          <textarea
            readOnly
            value={igCaption}
            rows={4}
            aria-label="Texto para copiar manualmente en Instagram"
            className="w-full resize-y rounded-lg border border-amber-200/80 bg-white px-2 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            onFocus={(e) => e.target.select()}
          />
        </div>
      ) : null}

      {hasNativeShare ? (
        <button
          type="button"
          onClick={() => void onNativeShare()}
          disabled={shareBusy}
          className={
            variant === "modal"
              ? "flex w-full min-h-[44px] items-center justify-center rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100/90 disabled:opacity-60 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-100 dark:hover:bg-emerald-950/55"
              : "flex w-full min-h-[44px] items-center justify-center rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100/90 disabled:opacity-60 sm:w-auto dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-100 dark:hover:bg-emerald-950/55"
          }
        >
          {shareBusy ? "Abriendo…" : "Compartir con el sistema…"}
        </button>
      ) : null}

      <div className={wrapClass}>
        {links.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={btnClass}
          >
            {label}
          </a>
        ))}
        <button type="button" onClick={onCopyUrl} className={btnClass}>
          Copiar enlace
        </button>
      </div>

      <div
        className={`rounded-xl border border-zinc-200/80 bg-white/60 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-950/30 ${variant === "modal" ? "space-y-2" : "space-y-2"}`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Instagram
        </p>
        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          La app no abre enlaces con texto prellenado como otras redes: aquí el
          flujo es leyenda (texto) o Stories (imagen 9:16); el enlace va en la
          leyenda o en bio. En{" "}
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            móvil
          </span>
          , al compartir la imagen se abre el menú del sistema: suele aparecer
          Instagram.
        </p>
        <div className={igWrapClass}>
          <button
            type="button"
            onClick={onCopyInstagramCaption}
            className={igMutedClass}
            title="Copia titular, marca y URL para pegar en la publicación o Reels."
          >
            Copiar leyenda
          </button>
          <button
            type="button"
            onClick={() => void onStoryImage()}
            disabled={storyBusy}
            className={igMutedClass}
            title="PNG vertical del servidor: copia el enlace y abre el menú para compartir la imagen (en móvil, Instagram)."
          >
            {storyBusy ? "Generando…" : storyButtonLabel}
          </button>
        </div>
      </div>

      <div className={wrapClass}>
        <button
          type="button"
          onClick={() => void onShareOgPng()}
          disabled={ogBusy}
          title="Misma imagen que usan las redes en la vista previa del enlace (1.91:1). En móvil puede abrir el menú de compartir archivo."
          className={secondaryClass}
        >
          {ogBusy ? "Generando…" : "Imagen vista previa (1.91:1)"}
        </button>
      </div>

      {visual ? (
        <HistoriaShareDomExportSection
          historiaId={historiaId}
          title={title}
          url={url}
          hostLabel={hostLabel}
          visual={visual}
          variant={variant}
          onFeedback={flash}
          onError={setError}
        />
      ) : null}
    </div>
  );
}
