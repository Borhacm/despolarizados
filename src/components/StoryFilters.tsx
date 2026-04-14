import Link from "next/link";

type MedioOpt = { slug: string; nombre: string };

const fieldBase =
  "mt-1.5 w-full rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500/60 dark:focus:ring-emerald-500/15";

const selectChevron =
  "appearance-none cursor-pointer bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-10 [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.8%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]";

export function StoryFilters({
  q,
  medio,
  ventana,
  orientacion,
  medios,
  action = "/",
  showMedio = true,
  clearHref,
  title,
  subtitle,
}: {
  q: string;
  medio: string;
  ventana: string;
  /** "" | izquierda | centro | derecha */
  orientacion: string;
  medios: MedioOpt[];
  /** Acción del formulario GET (home o feed). */
  action?: string;
  showMedio?: boolean;
  /** Enlace “Limpiar”; por defecto coincide con `action`. */
  clearHref?: string;
  /** Título sobre el bloque (p. ej. «Historias del momento»). */
  title?: string;
  /** Línea breve bajo el título. */
  subtitle?: string;
}) {
  const clear = clearHref ?? action;
  const idBase =
    action === "/" || action === ""
      ? "home"
      : action.replace(/^\//, "").replace(/\//g, "-") || "home";

  return (
    <section
      className="overflow-hidden rounded-2xl border border-emerald-200/55 bg-gradient-to-br from-white via-white to-emerald-50/40 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] dark:border-emerald-900/35 dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950/25"
      aria-labelledby={title ? `filters-title-${idBase}` : undefined}
    >
      {title ? (
        <div className="border-b border-emerald-200/40 bg-emerald-600/[0.04] px-4 py-3.5 dark:border-emerald-900/40 dark:bg-emerald-500/[0.06] sm:px-6">
          <h2
            id={`filters-title-${idBase}`}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300/95"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <form
        method="get"
        action={action}
        className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-4 lg:gap-y-3"
      >
        <div className="min-w-0 w-full lg:flex-[2_1_16rem]">
          <label
            htmlFor={`q-${idBase}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
          >
            Buscar
          </label>
          <input
            id={`q-${idBase}`}
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Palabras en titular o resumen…"
            defaultValue={q}
            className={fieldBase}
          />
        </div>

        <div className="min-w-0 w-full shrink-0 lg:w-[10.25rem]">
          <label
            htmlFor={`orientacion-${idBase}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
          >
            Cobertura
          </label>
          <select
            id={`orientacion-${idBase}`}
            name="orientacion"
            defaultValue={orientacion}
            className={`${fieldBase} ${selectChevron}`}
          >
            <option value="">Todas</option>
            <option value="izquierda">Izquierda</option>
            <option value="centro">Centro</option>
            <option value="derecha">Derecha</option>
          </select>
        </div>

        {showMedio ? (
          <div className="min-w-0 w-full shrink-0 lg:w-[11rem]">
            <label
              htmlFor={`medio-${idBase}`}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
            >
              Medio
            </label>
            <select
              id={`medio-${idBase}`}
              name="medio"
              defaultValue={medio}
              className={`${fieldBase} ${selectChevron}`}
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

        <div className="min-w-0 w-full shrink-0 lg:w-[13.5rem]">
          <label
            htmlFor={`ventana-${idBase}`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
          >
            Fecha
          </label>
          <select
            id={`ventana-${idBase}`}
            name="ventana"
            defaultValue={ventana}
            className={`${fieldBase} ${selectChevron}`}
          >
            <option value="all">Cualquier momento</option>
            <option value="24h">Últimas 24 h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>
        </div>

        <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:ml-auto lg:w-auto lg:min-w-[min(100%,15rem)] lg:justify-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] dark:bg-emerald-500 dark:hover:bg-emerald-400 sm:w-auto sm:min-w-[7.5rem]"
          >
            Aplicar
          </button>
          <Link
            href={clear}
            className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200/95 bg-white/80 px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 sm:w-auto"
          >
            Limpiar
          </Link>
        </div>
      </form>
    </section>
  );
}
