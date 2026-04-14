import { IngestaForm } from "@/app/admin/ingesta/IngestaForm";
import { hasAdminSecretConfigured } from "@/lib/admin-secret";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingesta",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminIngestaPage() {
  const hasSecret = hasAdminSecretConfigured();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
      >
        ← Inicio
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Ingesta de noticias
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Descarga RSS de los medios activos, genera embeddings y agrupa en
        historias. Equivale a{" "}
        <code className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">
          GET /api/cron/ingest
        </code>{" "}
        con el mismo Bearer.
      </p>

      {!hasSecret ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Configura <code className="font-mono">CRON_SECRET</code> o{" "}
          <code className="font-mono">ADMIN_SECRET</code> en{" "}
          <code className="font-mono">.env.local</code>.
        </div>
      ) : (
        <div className="mt-10">
          <IngestaForm />
        </div>
      )}
    </main>
  );
}
