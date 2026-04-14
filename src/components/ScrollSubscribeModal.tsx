"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_DISMISS = "despolarizados_newsletter_dismissed_until";
const STORAGE_SUBSCRIBED = "despolarizados_newsletter_subscribed";
const DISMISS_DAYS = 14;
const SCROLL_THRESHOLD = 0.32;

function readDismissedUntil(): number | null {
  try {
    const v = localStorage.getItem(STORAGE_DISMISS);
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function isDismissed(): boolean {
  const until = readDismissedUntil();
  if (!until) return false;
  return Date.now() < until;
}

function isSubscribedFlag(): boolean {
  try {
    return localStorage.getItem(STORAGE_SUBSCRIBED) === "1";
  } catch {
    return false;
  }
}

export function ScrollSubscribeModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "err">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isSubscribedFlag() || isDismissed()) return;

    const onScroll = () => {
      if (openedRef.current) return;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      const ratio = el.scrollTop / max;
      if (ratio >= SCROLL_THRESHOLD) {
        openedRef.current = true;
        setOpen(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = useCallback(() => {
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_DISMISS, String(until));
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus("loading");
      setMessage(null);
      try {
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), frequency }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
          error?: string;
        };
        if (!res.ok) {
          setStatus("err");
          setMessage(data.error || "No se pudo enviar la solicitud.");
          return;
        }
        setStatus("done");
        setMessage(data.message ?? "Revisa tu correo.");
        window.setTimeout(() => setOpen(false), 4000);
      } catch {
        setStatus("err");
        setMessage("Error de red. Inténtalo de nuevo.");
      }
    },
    [email, frequency],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6 sm:pb-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar"
        onClick={dismiss}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-[var(--surface)] p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2
          id="newsletter-modal-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Boletín Despolarizados
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Recibe por correo las historias nuevas que vayamos agrupando desde
          varios medios. Elige frecuencia y confirma el enlace que te enviemos.
        </p>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div>
            <label
              htmlFor="newsletter-email"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Correo
            </label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 outline-none ring-emerald-500/0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              placeholder="tu@correo.com"
              disabled={status === "loading"}
            />
          </div>
          <div>
            <span className="block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Frecuencia
            </span>
            <div className="mt-2 flex gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="frequency"
                  checked={frequency === "daily"}
                  onChange={() => setFrequency("daily")}
                  disabled={status === "loading"}
                />
                Diaria
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="frequency"
                  checked={frequency === "weekly"}
                  onChange={() => setFrequency("weekly")}
                  disabled={status === "loading"}
                />
                Semanal
              </label>
            </div>
          </div>
          {message ? (
            <p
              className={
                status === "err"
                  ? "text-sm text-red-600 dark:text-red-400"
                  : "text-sm text-emerald-700 dark:text-emerald-400"
              }
            >
              {message}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              disabled={status === "loading"}
            >
              Ahora no
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {status === "loading" ? "Enviando…" : "Suscribirme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
