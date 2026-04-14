"use client";

import {
  syncSeedMediosAction,
  type SyncSeedMediosState,
} from "@/app/admin/medios/actions";
import { MEDIOS_SEED } from "@/data/medios-seed";
import Link from "next/link";
import { useActionState } from "react";

const initial: SyncSeedMediosState = null;

export function SeedMediosForm() {
  const [state, formAction, isPending] = useActionState(
    syncSeedMediosAction,
    initial,
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Cargar catálogo semilla en Supabase
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Inserta o actualiza <strong>{MEDIOS_SEED.length} medios</strong> (misma lista
        que el repo).
        Úsalo si añadimos medios nuevos y no has vuelto a ejecutar el SQL en el
        panel de Supabase.
      </p>

      <form action={formAction} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="seedAdminSecret"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Clave (ADMIN_SECRET o CRON_SECRET)
          </label>
          <input
            id="seedAdminSecret"
            name="adminSecret"
            type="password"
            required
            autoComplete="off"
            className="mt-2 w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
          />
        </div>

        {state && !state.ok ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {state.error}
          </p>
        ) : null}

        {state && state.ok ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            Listo: {state.count} medios sincronizados.{" "}
            <Link
              href="/medios"
              className="font-semibold text-emerald-900 underline dark:text-emerald-50"
            >
              Ver catálogo
            </Link>
            .
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full min-h-[48px] rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 sm:w-auto dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {isPending
            ? "Sincronizando…"
            : `Sincronizar ${MEDIOS_SEED.length} medios semilla`}
        </button>
      </form>
    </div>
  );
}
