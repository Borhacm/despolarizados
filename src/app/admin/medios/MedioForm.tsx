"use client";

import { addMedio, type AddMedioState } from "@/app/admin/medios/actions";
import Link from "next/link";
import { useActionState } from "react";

const initial: AddMedioState = null;

export function MedioForm() {
  const [state, formAction, isPending] = useActionState(addMedio, initial);

  return (
    <form action={formAction} className="mx-auto max-w-lg space-y-5">
      <div>
        <label
          htmlFor="adminSecret"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Clave de administración
        </label>
        <p className="mt-1 text-xs text-zinc-500">
          Mismo valor que <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">ADMIN_SECRET</code> o{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">CRON_SECRET</code> en el servidor.
        </p>
        <input
          id="adminSecret"
          name="adminSecret"
          type="password"
          required
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Nombre
          </label>
          <input
            name="nombre"
            required
            placeholder="Ej. El País"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Slug (URL)
          </label>
          <input
            name="slug"
            required
            placeholder="ej. el-pais"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            URLs RSS (una por línea)
          </label>
          <textarea
            name="rss_urls"
            required
            rows={4}
            placeholder="https://…"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Sesgo (etiqueta)
          </label>
          <input
            name="sesgo"
            required
            placeholder="centro-derecha"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Factualidad
          </label>
          <input
            name="factualidad"
            required
            placeholder="alta"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Propiedad (opcional)
          </label>
          <input
            name="ownership"
            placeholder="Grupo editorial"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="prioridad"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Prioridad ingesta (1–5)
          </label>
          <select
            id="prioridad"
            name="prioridad"
            defaultValue="3"
            aria-label="Prioridad de ingesta de uno a cinco"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950 sm:text-sm"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input type="checkbox" name="active" defaultChecked className="rounded" />
            Activo
          </label>
        </div>
      </div>

      {state && !state.ok ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      {state && state.ok ? (
        <p className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
          Medio creado.{" "}
          <Link
            href={`/medios/${state.slug}`}
            className="font-medium underline"
          >
            Ver ficha
          </Link>
          .
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="min-h-[48px] w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {isPending ? "Guardando…" : "Añadir medio"}
      </button>
    </form>
  );
}
