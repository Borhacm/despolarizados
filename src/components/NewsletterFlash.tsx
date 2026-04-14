"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGES: Record<string, { text: string; tone: "ok" | "warn" | "bad" }> = {
  verified: {
    text: "Suscripción confirmada. Te enviaremos el resumen según la frecuencia elegida.",
    tone: "ok",
  },
  unsubscribed: {
    text: "Te has dado de baja del boletín.",
    tone: "ok",
  },
  invalid: {
    text: "El enlace no es válido o ha caducado.",
    tone: "warn",
  },
  error: {
    text: "No se pudo completar la acción. Inténtalo de nuevo más tarde.",
    tone: "bad",
  },
};

function Banner({ param }: { param: keyof typeof MESSAGES }) {
  const [expired, setExpired] = useState(false);
  const show = !expired;

  useEffect(() => {
    if (param === "verified" && typeof window !== "undefined") {
      try {
        localStorage.setItem("despolarizados_newsletter_subscribed", "1");
      } catch {
        /* ignore */
      }
    }

    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const next = new URLSearchParams(window.location.search);
      next.delete("newsletter");
      const qs = next.toString();
      window.history.replaceState({}, "", qs ? `${path}?${qs}` : path);
    }

    const t = window.setTimeout(() => setExpired(true), 9000);
    return () => window.clearTimeout(t);
  }, [param]);

  if (!show) return null;

  const { text, tone } = MESSAGES[param];
  const border =
    tone === "ok"
      ? "border-emerald-300/80 dark:border-emerald-700/80"
      : tone === "warn"
        ? "border-amber-300/80 dark:border-amber-700/80"
        : "border-red-300/80 dark:border-red-800/80";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4"
      role="status"
    >
      <div
        className={`pointer-events-auto max-w-lg rounded-2xl border ${border} bg-[var(--surface)] px-4 py-3 text-sm text-zinc-800 shadow-lg dark:bg-zinc-900 dark:text-zinc-100`}
      >
        {text}
      </div>
    </div>
  );
}

function Inner() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("newsletter");
  if (!raw || !(raw in MESSAGES)) return null;

  return <Banner key={raw} param={raw as keyof typeof MESSAGES} />;
}

export function NewsletterFlash() {
  return <Inner />;
}
