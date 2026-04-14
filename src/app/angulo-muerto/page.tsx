import { LogoMark } from "@/components/LogoMark";
import { StoryCard } from "@/components/StoryCard";
import { getAppBaseUrl } from "@/lib/app-base-url";
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
      <main className="mx-auto max-w-3xl flex-1 overflow-x-clip px-4 py-16 text-center text-zinc-600">
        Configura Supabase en <code>.env.local</code>.
      </main>
    );
  }

  const base = getAppBaseUrl();

  let rows: Awaited<ReturnType<typeof fetchBlindspotHistorias>> = [];
  try {
    rows = await fetchBlindspotHistorias(supabase, { limit: 24 });
  } catch {
    return (
      <main className="mx-auto max-w-3xl flex-1 overflow-x-clip px-4 py-16 text-center text-red-600">
        Error al cargar historias.
      </main>
    );
  }

  const ids = rows.map((r) => r.id);
  const covers = await fetchCoverImagesByHistoriaIds(supabase, ids);

  return (
    <main className="mx-auto max-w-6xl flex-1 overflow-x-clip px-4 py-10 sm:px-6">
      <div className="mb-10 w-full">
        <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 max-w-3xl flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
              Cobertura desequilibrada
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Ángulo muerto
            </h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              Temas donde la mayor parte de los medios que informan se concentran
              en un solo lado del espectro (izquierda, centro o derecha). Es
              orientativo, no una verificación independiente.
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
          <LogoMark
            size="pageHero"
            className="shrink-0 self-end !h-28 !w-28 sm:!h-[10.5rem] sm:!w-[10.5rem] sm:self-start"
          />
        </div>
      </div>

      <div className="relative isolate">
        {/* Marca de agua: 450 % del logo de header; z-0 detrás de tarjetas */}
        <div
          className="pointer-events-none absolute -right-4 top-8 z-0 select-none sm:-right-8 sm:top-10 md:top-12"
          aria-hidden
        >
          <LogoMark
            size="pageBackdrop"
            className="opacity-[0.09] dark:opacity-[0.12]"
          />
        </div>

        {rows.length === 0 ? (
          <p className="relative z-10 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
            Aún no hay historias con varios medios y cobertura muy sesgada. Ejecuta
            la ingesta cuando tengas datos.
          </p>
        ) : (
          <ul className="relative z-10 space-y-5">
            {rows.map((h) => (
              <li key={h.id}>
                <StoryCard
                  h={h}
                  coverUrl={covers.get(h.id)}
                  coverageMix={h.coverageMix}
                  layout="split"
                  shareUrl={`${base}/historia/${h.id}`}
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
      </div>
    </main>
  );
}
