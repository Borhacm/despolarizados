import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Acceso interno",
  description: "Panel de administración (no indexado).",
  robots: { index: false, follow: false },
};

export default function AccesoInternoPage() {
  return (
    <main className="mx-auto max-w-lg flex-1 overflow-x-clip px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-zinc-200 bg-[var(--surface)] p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Uso interno
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
          Administración
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Esta URL no aparece en la web pública. Guárdala o usa{" "}
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
            Alt
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
            Shift
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
            A
          </kbd>{" "}
          en cualquier página (fuera de campos de texto).
        </p>
        <p className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 px-3 py-2.5 text-xs leading-relaxed text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
          Ingesta sin OpenAI: modo <code className="font-mono">lexical</code> por
          defecto. Las etiquetas de orientación en la UI son referenciales; en
          producción valida fuentes y cumplimiento legal.
        </p>
        <ul className="mt-6 space-y-3">
          <li>
            <Link
              href="/admin/ingesta"
              className="flex min-h-[48px] items-center rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60"
            >
              Ingesta de noticias
            </Link>
          </li>
          <li>
            <Link
              href="/admin/medios"
              className="flex min-h-[48px] items-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
            >
              Medios y alta de RSS
            </Link>
          </li>
          <li>
            <Link
              href="/admin/historias"
              className="flex min-h-[48px] items-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
            >
              Fusionar historias duplicadas
            </Link>
          </li>
        </ul>
        <p className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-500">
          <Link
            href="/"
            className="font-medium text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
          >
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
