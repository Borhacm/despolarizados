import { StoryCard } from "@/components/StoryCard";
import { fetchBlindspotHistorias } from "@/lib/blindspot-historias";
import { fetchCoverImagesByHistoriaIds } from "@/lib/historia-covers";
import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ángulo muerto",
  description:
    "Historias donde casi toda la cobertura cae en un solo lado del espectro editorial.",
};

export default async function AnguloMuertoPage() {
  const supabase = createPublicClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-zinc-600">
        Configura Supabase en <code>.env.local</code>.
      </main>
    );
  }

  let rows: Awaited<ReturnType<typeof fetchBlindspotHistorias>> = [];
  try {
    rows = await fetchBlindspotHistorias(supabase, { limit: 24 });
  } catch {
    return (
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 text-center text-red-600">
        Error al cargar historias.
      </main>
    );
  }

  const ids = rows.map((r) => r.id);
  const covers = await fetchCoverImagesByHistoriaIds(supabase, ids);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-10 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
          Cobertura desequilibrada
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Ángulo muerto
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Temas donde la mayor parte de los medios que informan se concentran en
          un solo lado del espectro (izquierda, centro o derecha). Es orientativo,
          no una verificación independiente.
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          <Link
            href="/"
            className="font-medium text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400"
          >
            ← Volver al inicio
          </Link>
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
          Aún no hay historias con varios medios y cobertura muy sesgada. Ejecuta
          la ingesta cuando tengas datos.
        </p>
      ) : (
        <ul className="space-y-5">
          {rows.map((h) => (
            <li key={h.id}>
              <StoryCard
                h={h}
                coverUrl={covers.get(h.id)}
                coverageMix={h.coverageMix}
                layout="split"
                blindspotHint={{
                  label: h.skewLabel,
                  pct: Math.max(
                    h.coverageMix.izqPct,
                    h.coverageMix.centroPct,
                    h.coverageMix.derPct,
                  ),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
