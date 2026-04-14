import { ADMIN_HUB_PATH } from "@/lib/admin-hub";
import Link from "next/link";

export function MediosEmptyState() {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white p-8 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-zinc-950/40">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        No hay medios en la base de datos
      </h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        La tabla <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">medios</code> está vacía o la semilla no se ha ejecutado.
      </p>

      <ol className="mt-6 list-decimal space-y-4 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
        <li>
          Abre el <strong>SQL Editor</strong> de tu proyecto en{" "}
          <a
            href="https://supabase.com/dashboard"
            className="font-medium text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Supabase
          </a>
          .
        </li>
        <li>
          Si aún no lo hiciste, ejecuta el archivo{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono dark:bg-zinc-900">
            supabase/migrations/20260414000000_init.sql
          </code>{" "}
          (crea tablas y RLS).
        </li>
        <li>
          Ejecuta después el semillado:{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono dark:bg-zinc-900">
            supabase/seed_medios.sql
          </code>{" "}
          — ejecuta la semilla SQL de <strong>medios</strong> (RSS).
        </li>
        <li>
          Recarga esta página. Opcional: añade más desde{" "}
          <Link
            href={ADMIN_HUB_PATH}
            className="font-medium text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
          >
            acceso interno → medios
          </Link>
          .
        </li>
      </ol>

      <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
        Si el seed falla por duplicados, el script usa{" "}
        <code className="font-mono">ON CONFLICT (slug) DO UPDATE</code> y debería
        actualizar filas existentes.
      </p>
    </div>
  );
}
