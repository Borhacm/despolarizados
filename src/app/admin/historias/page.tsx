import { MergeHistoriasForm } from "@/app/admin/historias/MergeHistoriasForm";
import { hasAdminSecretConfigured } from "@/lib/admin-secret";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fusionar historias",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminHistoriasPage() {
  const hasSecret = hasAdminSecretConfigured();

  return (
    <main className="mx-auto max-w-3xl flex-1 overflow-x-clip px-4 py-10 sm:px-6">
      <Link
        href="/acceso-interno"
        className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
      >
        ← Acceso interno
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Fusionar historias duplicadas
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Cuando la ingesta crea dos historias para el mismo hecho (titulares muy
        distintos), une aquí todos los artículos en una sola. Abre cada tarjeta,
        copia el ID de la URL{" "}
        <code className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">
          /historia/[id]
        </code>
        , elige cuál historia quieres conservar y cuál eliminar.
      </p>

      {!hasSecret ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Configura <code className="font-mono">CRON_SECRET</code> o{" "}
          <code className="font-mono">ADMIN_SECRET</code> en{" "}
          <code className="font-mono">.env.local</code>.
        </div>
      ) : (
        <div className="mt-10">
          <MergeHistoriasForm />
        </div>
      )}
    </main>
  );
}
