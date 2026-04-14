"use client";

import { useState } from "react";
import { HistoriaShareModal } from "@/components/HistoriaShareModal";
import type { HistoriaShareVisualPayload } from "@/lib/share/historia-share-visual";

type Props = {
  historiaId: string;
  title: string;
  shareUrl: string;
  visual?: HistoriaShareVisualPayload | null;
  /** Por defecto empuja el botón al final (listados). En ficha de historia usar false. */
  alignEnd?: boolean;
};

export function StoryCardShareButton({
  historiaId,
  title,
  shareUrl,
  visual = null,
  alignEnd = true,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          alignEnd
            ? "ml-auto inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg px-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-emerald-700 sm:min-h-0 sm:min-w-0 sm:justify-start sm:px-0 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-emerald-300"
            : "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg px-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-emerald-700 sm:min-h-0 sm:min-w-0 sm:justify-start sm:px-0 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-emerald-300"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Compartir esta historia"
      >
        <span className="text-xs font-medium tracking-wide">Compartir</span>
        <svg
          className="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49" />
        </svg>
      </button>
      <HistoriaShareModal
        open={open}
        onClose={() => setOpen(false)}
        historiaId={historiaId}
        title={title}
        url={shareUrl}
        visual={visual}
      />
    </>
  );
}
