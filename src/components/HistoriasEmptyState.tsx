import { ADMIN_HUB_PATH } from "@/lib/admin-hub";
import Link from "next/link";

export function HistoriasEmptyState({
  variant,
}: {
  /** Sin datos en la BD (0 historias) vs. filtros que no devuelven nada. */
  variant: "no-catalog" | "no-match";
}) {
  if (variant === "no-match") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="text-zinc-600 dark:text-zinc-400">
          No hay historias que coincidan con estos filtros. Prueba{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">
            Fecha → Cualquier momento
          </strong>
          , quitar la búsqueda o{" "}
          <Link href="/" className="font-medium text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400">
            limpiar
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white p-8 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-zinc-950/40">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Aún no hay historias en la base de datos
      </h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Las historias aparecen cuando la <strong>ingesta</strong> descarga RSS y
        agrupa titulares (por defecto <strong>sin OpenAI</strong>, modo léxico).
        Si acabas de crear el proyecto, hay que ejecutarla al menos una vez.
      </p>

      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
        <li>
          Confirma que en Supabase existen las tablas y el seed de medios:{" "}
          <code className="rounded bg-white px-1 font-mono dark:bg-zinc-900">
            supabase/migrations/20260414000000_init.sql
          </code>{" "}
          y{" "}
          <code className="rounded bg-white px-1 font-mono dark:bg-zinc-900">
            seed_medios.sql
          </code>
          .
        </li>
        <li>
          En <code className="font-mono">.env.local</code> necesitas{" "}
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> y{" "}
          <code className="font-mono">CRON_SECRET</code> (o{" "}
          <code className="font-mono">ADMIN_SECRET</code>).{" "}
          <code className="font-mono">OPENAI_API_KEY</code> solo si usas{" "}
          <code className="font-mono">INGEST_CLUSTER_MODE=openai</code>.
        </li>
        <li>
          Ejecuta la ingesta desde el panel:{" "}
          <Link
            href={ADMIN_HUB_PATH}
            className="font-medium text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
          >
            acceso interno → ingesta
          </Link>{" "}
          (misma clave que el cron), o bien con curl:
        </li>
      </ol>

      <pre className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        curl -sS -H &quot;Authorization: Bearer TU_CRON_SECRET&quot; \
          &quot;http://localhost:3000/api/cron/ingest&quot;
      </pre>

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
        La primera ejecución puede tardar un minuto o varios. Si falla, revisa la
        respuesta JSON o{" "}
        <Link href="/medios" className="underline">
          que los medios tengan RSS
        </Link>
        .
      </p>
    </div>
  );
}
