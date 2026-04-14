"use client";

import {
  mergeHistoriasAction,
  type MergeHistoriasState,
} from "@/app/admin/historias/actions";
import { useActionState } from "react";

const initial: MergeHistoriasState = null;

export function MergeHistoriasForm() {
  const [state, formAction, isPending] = useActionState(
    mergeHistoriasAction,
    initial,
  );

  return (
    <form action={formAction} className="mx-auto max-w-lg space-y-5">
      <div>
        <label
          htmlFor="adminSecret"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Clave (ADMIN_SECRET o CRON_SECRET)
        </label>
        <input
          id="adminSecret"
          name="adminSecret"
          type="password"
          required
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label
          htmlFor="targetHistoriaId"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Historia que conservas (destino)
        </label>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          UUID de la página que quieres mantener (p. ej. copiado de la URL{" "}
          <code className="font-mono">/historia/[id]</code>).
        </p>
        <input
          id="targetHistoriaId"
          name="targetHistoriaId"
          type="text"
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label
          htmlFor="sourceHistoriaId"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Historia que se fusiona y elimina (origen)
        </label>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Todos sus artículos pasan al destino; esta fila se borra.
        </p>
        <input
          id="sourceHistoriaId"
          name="sourceHistoriaId"
          type="text"
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {state && !state.ok ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      {state && state.ok ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-3 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
          <p className="font-medium">Fusión correcta</p>
          <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs">
            <li>Artículos movidos: {state.articlesMoved}</li>
            <li>Historia conservada: {state.targetId}</li>
            <li>Eliminada: {state.removedHistoriaId}</li>
          </ul>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {isPending ? "Fusionando…" : "Fusionar historias"}
      </button>
    </form>
  );
}
