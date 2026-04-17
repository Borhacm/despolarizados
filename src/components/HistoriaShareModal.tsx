"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HistoriaShareOptions } from "@/components/HistoriaShareOptions";

type Props = {
  open: boolean;
  onClose: () => void;
  historiaId: string;
  title: string;
  url: string;
};

export function HistoriaShareModal({
  open,
  onClose,
  historiaId,
  title,
  url,
}: Props) {
  const labelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/55 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center sm:pb-4 dark:bg-black/65"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="max-h-[min(90dvh,calc(100vh-2rem-env(safe-area-inset-bottom)))] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={labelId}
            className="min-w-0 flex-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Compartir
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="-mr-1 inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Cerrar"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <HistoriaShareOptions
          variant="modal"
          historiaId={historiaId}
          title={title}
          url={url}
        />
      </div>
    </div>,
    document.body,
  );
}
