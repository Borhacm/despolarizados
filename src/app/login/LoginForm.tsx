"use client";

import { createBrowserSupabase } from "@/lib/supabase/browser";
import { useCallback, useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
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
        const supabase = createBrowserSupabase();
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/feed`,
          },
        });
        if (error) {
          setStatus("err");
          setMessage(error.message);
          return;
        }
        setStatus("done");
        setMessage(
          "Revisa tu bandeja: te hemos enviado un enlace para entrar.",
        );
      } catch {
        setStatus("err");
        setMessage("Error de red. Inténtalo de nuevo.");
      }
    },
    [email],
  );

  if (status === "done") {
    return (
      <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
        {message}
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label
          htmlFor="login-email"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
        >
          Correo
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      {message && status === "err" ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
      >
        {status === "loading" ? "Enviando…" : "Enviar enlace de acceso"}
      </button>
    </form>
  );
}
