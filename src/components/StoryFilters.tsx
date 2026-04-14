import Link from "next/link";

type MedioOpt = { slug: string; nombre: string };

export function StoryFilters({
  q,
  medio,
  ventana,
  orden,
  medios,
  action = "/",
  showMedio = true,
  clearHref,
}: {
  q: string;
  medio: string;
  ventana: string;
  /** importancia | reciente */
  orden: string;
  medios: MedioOpt[];
  /** Acción del formulario GET (home o feed). */
  action?: string;
  showMedio?: boolean;
  /** Enlace “Limpiar”; por defecto coincide con `action`. */
  clearHref?: string;
}) {
  const clear = clearHref ?? action;

  return (
    <form
      method="get"
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200/95 bg-[var(--surface)] p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950/40 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="min-w-[200px] flex-1">
        <label
          htmlFor={`q-${action}`}
          className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
        >
          Buscar
        </label>
        <input
          id={`q-${action}`}
          name="q"
          type="search"
          placeholder="Buscar (español, palabras clave)…"
          defaultValue={q}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      {showMedio ? (
        <div className="min-w-[160px]">
          <label
            htmlFor={`medio-${action}`}
            className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            Medio
          </label>
          <select
            id={`medio-${action}`}
            name="medio"
            defaultValue={medio}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Todos</option>
            {medios.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="min-w-[140px]">
        <label
          htmlFor={`ventana-${action}`}
          className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
        >
          Fecha
        </label>
        <select
          id={`ventana-${action}`}
          name="ventana"
          defaultValue={ventana}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="all">Cualquier momento</option>
          <option value="24h">Últimas 24 h</option>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
        </select>
      </div>
      <div className="min-w-[150px]">
        <label
          htmlFor={`orden-${action}`}
          className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
        >
          Orden
        </label>
        <select
          id={`orden-${action}`}
          name="orden"
          defaultValue={orden}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="importancia">Relevancia</option>
          <option value="reciente">Más reciente</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          Aplicar
        </button>
        <Link
          href={clear}
          className="inline-flex items-center rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Limpiar
        </Link>
      </div>
    </form>
  );
}
