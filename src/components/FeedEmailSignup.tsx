"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

/**
 * Estado vacío de /feed: prioriza dejar correo (verificación vía API newsletter)
 * y ofrece el flujo sin cuenta (cookie) como alternativa.
 */
export function FeedEmailSignup() {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "err">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

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
        setMessage(
          data.message ??
            "Revisa tu correo y abre el enlace para confirmar.",
        );
      } catch {
        setStatus("err");
        setMessage("Error de red. Inténtalo de nuevo.");
      }
    },
    [email, frequency],
  );

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/90 via-white to-white p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-zinc-950 dark:to-zinc-950 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300/90">
          Paso 1 · Cuenta y Para ti
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
          Entra con tu correo para guardar tu selección en Para ti
        </h2>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Lo principal es{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
          >
            iniciar sesión con un enlace mágico
          </Link>
          : así sabemos qué usuario visita <strong>Para ti</strong> y tus medios
          seguidos se guardan en la base de datos. Abajo puedes suscribirte al
          boletín (otro correo de confirmación).
        </p>

        {status === "done" ? (
          <div
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
            role="status"
          >
            {message}
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label
                htmlFor="feed-signup-email"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
              >
                Correo electrónico
              </label>
              <input
                id="feed-signup-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                Boletín (opcional al confirmar)
              </legend>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-700 dark:text-zinc-300">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="frequency"
                    checked={frequency === "daily"}
                    onChange={() => setFrequency("daily")}
                    className="border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Resumen diario
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="frequency"
                    checked={frequency === "weekly"}
                    onChange={() => setFrequency("weekly")}
                    className="border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Resumen semanal
                </label>
              </div>
            </fieldset>
            {message && status === "err" ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={status === "loading"}
              className="min-h-[48px] w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400 sm:w-auto sm:min-w-[12rem]"
            >
              {status === "loading" ? "Enviando…" : "Enviar enlace al correo"}
            </button>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200/90 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/50 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Paso 2 · Sin correo (solo este navegador)
        </p>
        <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Elige medios en el catálogo
        </h3>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Puedes configurar Para ti ya mismo sin cuenta: entra en cada medio y
          pulsa{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">
            Seguir en Para ti
          </strong>
          . La lista se guarda en una{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">cookie</strong> en
          este dispositivo (no se sincroniza con otros).
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/medios"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Ir al catálogo de medios
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            ← Todas las historias
          </Link>
        </div>
      </div>
    </div>
  );
}
