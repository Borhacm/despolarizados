"use client";

import {
  runIngestaAction,
  type IngestaState,
} from "@/app/admin/ingesta/actions";
import Link from "next/link";
import { useActionState } from "react";

const initial: IngestaState = null;

export function IngestaForm() {
  const [state, formAction, isPending] = useActionState(
    runIngestaAction,
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
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
        />
      </div>

      {state && !state.ok ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      {state && state.ok ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-3 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
          <p className="font-medium">Ingesta terminada</p>
          <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs">
            <li>
              Agrupación:{" "}
              {state.result.clusterMode === "lexical"
                ? "léxica (sin OpenAI)"
                : "OpenAI embeddings"}
            </li>
            <li>Feeds: {state.result.feedsProcessed}</li>
            <li>Ítems vistos: {state.result.itemsSeen}</li>
            <li>Artículos insertados: {state.result.articlesInserted}</li>
            <li>Duplicados omitidos: {state.result.skippedDuplicate}</li>
            {state.result.errors.length ? (
              <li className="text-red-800 dark:text-red-200">
                Errores: {state.result.errors.length}
              </li>
            ) : null}
          </ul>
          {state.result.errors.length ? (
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-white/80 p-2 text-xs dark:bg-zinc-900">
              {state.result.errors.join("\n")}
            </pre>
          ) : null}
          <p className="mt-4">
            <Link
              href="/"
              className="font-medium text-teal-800 underline dark:text-teal-200"
            >
              Ver historias
            </Link>
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[48px] w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {isPending ? "Ingestando…" : "Ejecutar ingesta ahora"}
      </button>
    </form>
  );
}
