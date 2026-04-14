import { MedioCard } from "@/components/MedioCard";
import { MediosEmptyState } from "@/components/MediosEmptyState";
import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Medios",
  description: "Catálogo de medios y sesgo orientativo.",
};

export default async function MediosPage() {
  const supabase = createPublicClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-600">
        Configura las variables de Supabase en <code>.env.local</code>.
      </div>
    );
  }

  const { data: medios, error } = await supabase
    .from("medios")
    .select("*")
    .eq("active", true)
    .order("prioridad", { ascending: false })
    .order("nombre", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-semibold">Error al cargar medios</p>
          <p className="mt-2 font-mono text-sm opacity-90">{error.message}</p>
          <p className="mt-4 text-sm opacity-80">
            Comprueba RLS (lectura pública en <code>medios</code>) y que la
            migración esté aplicada.
          </p>
        </div>
      </main>
    );
  }

  const list = medios ?? [];

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
            Catálogo
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Medios
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Cada tarjeta resume sesgo y factualidad (orientativos). Pulsa en un
            medio para ver el detalle y seguirlo en{" "}
            <Link
              href="/feed"
              className="font-semibold text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Mi feed
            </Link>
            .
          </p>
        </div>
        {list.length > 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {list.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              en catálogo
            </p>
          </div>
        ) : null}
      </div>

      {list.length === 0 ? (
        <MediosEmptyState />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <li key={m.id}>
              <MedioCard
                m={{
                  id: m.id,
                  nombre: m.nombre,
                  slug: m.slug,
                  rss_urls: m.rss_urls as string[] | null,
                  sesgo: m.sesgo,
                  factualidad: m.factualidad,
                  ownership: m.ownership,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
