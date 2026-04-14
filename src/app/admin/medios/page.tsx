import { MedioForm } from "@/app/admin/medios/MedioForm";
import { SeedMediosForm } from "@/app/admin/medios/SeedMediosForm";
import { hasAdminSecretConfigured } from "@/lib/admin-secret";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Añadir medio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminMediosPage() {
  const hasSecret = hasAdminSecretConfigured();

  return (
    <main className="mx-auto max-w-3xl flex-1 overflow-x-clip px-4 py-10 sm:px-6">
      <Link
        href="/medios"
        className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
      >
        ← Volver a medios
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Añadir medio
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Inserta una fila en el catálogo (escalable). La ingesta usará los RSS
        listados en las siguientes ejecuciones del cron.
      </p>

      {!hasSecret ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Configura <code className="font-mono">CRON_SECRET</code> o{" "}
          <code className="font-mono">ADMIN_SECRET</code> en{" "}
          <code className="font-mono">.env.local</code> y reinicia{" "}
          <code className="font-mono">npm run dev</code>.
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <SeedMediosForm />
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Añadir un medio a mano
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Un solo RSS o varios (uno por línea).
            </p>
            <div className="mt-6">
              <MedioForm />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
