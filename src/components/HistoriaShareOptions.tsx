"use client";

import { HistoriaShareOgPreview } from "@/components/share/HistoriaShareOgPreview";
import { HistoriaShareDomExportSection } from "@/components/share/HistoriaShareDomExportSection";
import {
  IconFacebook,
  IconImage,
  IconLinkedIn,
  IconLink,
  IconReddit,
  IconShareSystem,
  IconWhatsApp,
  IconX,
} from "@/components/share/share-brand-icons";
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
  url: string;
  variant?: "bar" | "modal";
  visual?: HistoriaShareVisualPayload | null;
};

function useServerFetchPaths(historiaId: string, canonicalUrl: string) {
  return useMemo(() => {
    const ogPath = `/historia/${historiaId}/opengraph-image`;
    const storyPath = `/historia/${historiaId}/story-image`;
    if (typeof window === "undefined") {
      try {
        const origin = new URL(canonicalUrl).origin;
        return { og: `${origin}${ogPath}`, story: `${origin}${storyPath}` };
      } catch {
        return { og: ogPath, story: storyPath };
      }
    }
    try {
      const origin = new URL(canonicalUrl).origin;
      if (origin === window.location.origin) {
        return { og: ogPath, story: storyPath };
      }
      return { og: `${origin}${ogPath}`, story: `${origin}${storyPath}` };
    } catch {
      return { og: ogPath, story: storyPath };
    }
  }, [historiaId, canonicalUrl]);
}

const iconBtnBase =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white shadow-sm transition hover:border-emerald-300/80 hover:bg-emerald-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-emerald-700/80 dark:hover:bg-emerald-950/30";

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
  const fetchPaths = useServerFetchPaths(historiaId, url);

  const hostLabel = useMemo(() => {
    try {
      return new URL(url).host;
    } catch {
      return "";
    }
  }, [url]);

  const linkItems = useMemo(
    () =>
      [
        {
          key: "x",
          href: buildTwitterIntentUrl(url, title),
          label: "Abrir en X",
          Icon: IconX,
        },
        {
          key: "whatsapp",
          href: buildWhatsAppShareUrl(title, url),
          label: "Compartir en WhatsApp",
          Icon: IconWhatsApp,
        },
        {
          key: "linkedin",
          href: buildLinkedInShareUrl(url),
          label: "Compartir en LinkedIn",
          Icon: IconLinkedIn,
        },
        {
          key: "facebook",
          href: buildFacebookShareUrl(url),
          label: "Compartir en Facebook",
          Icon: IconFacebook,
        },
        {
          key: "reddit",
          href: buildRedditSubmitUrl(url, title),
          label: "Publicar en Reddit",
          Icon: IconReddit,
        },
      ] as const,
    [title, url],
  );

  const flash = useCallback((msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 2600);
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
      if (ok) flash("Enlace copiado.");
      else window.prompt("Copia el enlace:", url);
    });
  }, [copyUrlToClipboardAsync, flash, url]);

  const onCopyInstagramCaption = useCallback(() => {
    setShowIgManual(false);
    setError(null);

    if (copyTextToClipboard(igCaption)) {
      flash("Leyenda copiada.");
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(igCaption).then(
        () => flash("Leyenda copiada."),
        () => setShowIgManual(true),
      );
      return;
    }
    setShowIgManual(true);
  }, [flash, igCaption]);

  const fetchPng = useCallback(async (path: string) => {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    return res.blob();
  }, []);

  const onShareOgPng = useCallback(async () => {
    setOgBusy(true);
    setError(null);
    try {
      const blob = await fetchPng(fetchPaths.og);
      const name = `despolarizados-og-${historiaId.slice(0, 8)}.png`;
      const result = await sharePngBlobWithWebShareOrDownload({
        blob,
        fileName: name,
        title,
        caption: snippet,
        url,
        copyUrlToClipboard: copyUrlToClipboardAsync,
      });
      if (result === "shared") flash("Listo.");
      else if (result === "downloaded") flash("PNG descargado.");
    } catch {
      setError("No se pudo obtener el PNG 1.91:1 (revisa la red).");
    } finally {
      setOgBusy(false);
    }
  }, [
    copyUrlToClipboardAsync,
    fetchPng,
    flash,
    fetchPaths.og,
    historiaId,
    snippet,
    title,
    url,
  ]);

  const onStoryImage = useCallback(async () => {
    setStoryBusy(true);
    setError(null);
    try {
      const blob = await fetchPng(fetchPaths.story);
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
            ? "Elige Instagram en el menú si aparece."
            : "Listo.",
        );
      } else if (result === "downloaded") {
        flash("PNG descargado.");
      }
    } catch {
      setError("No se pudo obtener el PNG 9:16.");
    } finally {
      setStoryBusy(false);
    }
  }, [
    copyUrlToClipboardAsync,
    fetchPng,
    flash,
    fetchPaths.story,
    historiaId,
    mobileUi,
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

  const imgRowBtnClass =
    variant === "modal"
      ? "inline-flex min-h-[44px] flex-1 basis-[calc(50%-0.25rem)] items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-emerald-300 hover:bg-white disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:border-emerald-700"
      : "inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-2 py-2 text-xs font-semibold text-zinc-800 shadow-sm transition hover:border-emerald-300 disabled:opacity-60 sm:min-h-0 sm:max-w-[11rem] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100";

  const igBtnClass =
    "inline-flex w-full min-h-[44px] items-center justify-center rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-violet-400 hover:bg-violet-50/60 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-violet-600 dark:hover:bg-violet-950/25 sm:min-h-[40px] sm:text-sm";

  const nativeBtnClass =
    variant === "modal"
      ? "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-100/90 disabled:opacity-60 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-100 dark:hover:bg-emerald-950/55"
      : "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-100/90 disabled:opacity-60 sm:min-h-0 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-100";

  const networksWrap =
    variant === "modal"
      ? "flex flex-wrap justify-center gap-2 sm:justify-start"
      : "flex flex-wrap items-center justify-end gap-2";

  return (
    <div className={variant === "modal" ? "space-y-4" : "space-y-3"}>
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
            Copia manualmente (Cmd/Ctrl+C).
          </p>
          <textarea
            readOnly
            value={igCaption}
            rows={4}
            aria-label="Texto para copiar en Instagram"
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
          className={nativeBtnClass}
        >
          <IconShareSystem className="h-5 w-5 shrink-0" />
          {shareBusy ? "Abriendo…" : mobileUi ? "Compartir…" : "Compartir con el sistema"}
        </button>
      ) : null}

      {variant === "modal" ? (
        <HistoriaShareOgPreview historiaId={historiaId} canonicalUrl={url} />
      ) : null}

      {variant === "modal" ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Imagen generada en servidor
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onStoryImage()}
              disabled={storyBusy}
              className={imgRowBtnClass}
              title="PNG 9:16 para Stories u otras apps"
            >
              <IconImage className="h-5 w-5 shrink-0" />
              {storyBusy ? "…" : "9:16 PNG"}
            </button>
            <button
              type="button"
              onClick={() => void onShareOgPng()}
              disabled={ogBusy}
              className={imgRowBtnClass}
              title="PNG 1.91:1, misma proporción que la vista previa del enlace"
            >
              <IconImage className="h-5 w-5 shrink-0" />
              {ogBusy ? "…" : "1.91:1 PNG"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => void onStoryImage()}
            disabled={storyBusy}
            className={imgRowBtnClass}
          >
            <IconImage className="h-4 w-4 shrink-0" />
            {storyBusy ? "…" : "9:16"}
          </button>
          <button
            type="button"
            onClick={() => void onShareOgPng()}
            disabled={ogBusy}
            className={imgRowBtnClass}
          >
            <IconImage className="h-4 w-4 shrink-0" />
            {ogBusy ? "…" : "1.91:1"}
          </button>
        </div>
      )}

      <div>
        <p
          className={`mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ${variant === "bar" ? "sr-only" : ""}`}
        >
          Redes y enlace
        </p>
        <div className={networksWrap}>
          {linkItems.map(({ key, href, label, Icon }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className={iconBtnBase}
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
          <button
            type="button"
            onClick={onCopyUrl}
            aria-label="Copiar enlace"
            title="Copiar enlace"
            className={iconBtnBase}
          >
            <IconLink className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 px-3 py-3 dark:border-zinc-700/80 dark:bg-zinc-950/30">
        <p className="mb-2 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            Instagram
          </span>{" "}
          no rellena enlaces en publicaciones: usa leyenda copiada o la imagen 9:16.
        </p>
        <button
          type="button"
          onClick={onCopyInstagramCaption}
          className={igBtnClass}
        >
          Copiar leyenda
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
