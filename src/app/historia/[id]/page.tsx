import { BiasMeter } from "@/components/BiasMeter";
import { CoverageMixBar } from "@/components/CoverageMixBar";
import { SesgoPill } from "@/components/SesgoPill";
import { coverageMixFromSesgos } from "@/lib/coverage-mix";
import { formatDateTimeEs } from "@/lib/format";
import { createPublicClient } from "@/lib/supabase/public";
import { sesgoToPosition } from "@/lib/sesgo";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  if (!supabase) return { title: "Historia" };
  const { data } = await supabase
    .from("historias")
    .select("titulo_canonico")
    .eq("id", id)
    .maybeSingle();
  const t = data?.titulo_canonico as string | undefined;
  if (!t) return { title: "Historia" };
  const short = t.length > 58 ? `${t.slice(0, 55)}…` : t;
  return { title: short };
}

export default async function HistoriaPage(props: PageProps) {
  const { id } = await props.params;
  const supabase = createPublicClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-600">
        Configura las variables de Supabase en <code>.env.local</code>.
      </div>
    );
  }

  const { data: historia, error: hErr } = await supabase
    .from("historias")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (hErr || !historia) notFound();

  const { data: articulos } = await supabase
    .from("articulos")
    .select("*")
    .eq("historia_id", id)
    .order("fecha_pub", { ascending: true, nullsFirst: false });

  const arts = articulos ?? [];
  const medioIds = [...new Set(arts.map((a) => a.medio_id))];

  const { data: mediosCover } =
    medioIds.length > 0
      ? await supabase
          .from("medios")
          .select("*")
          .in("id", medioIds)
      : { data: [] };

  const medioMap = new Map((mediosCover ?? []).map((m) => [m.id, m]));

  const artsBySpectrum = [...arts].sort((a, b) => {
    const pa = sesgoToPosition(medioMap.get(a.medio_id)?.sesgo ?? "");
    const pb = sesgoToPosition(medioMap.get(b.medio_id)?.sesgo ?? "");
    return pa - pb;
  });

  const { data: allMedios } = await supabase
    .from("medios")
    .select("id, nombre, slug, sesgo")
    .eq("active", true)
    .order("nombre");

  const covered = new Set(medioIds);
  const ausencias = (allMedios ?? []).filter((m) => !covered.has(m.id));

  const positions = (mediosCover ?? []).map((m) => sesgoToPosition(m.sesgo));
  const avgPos =
    positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : 50;

  const sesgosPorNoticia: string[] = [];
  for (const a of arts) {
    const m = medioMap.get(a.medio_id);
    if (m?.sesgo) sesgosPorNoticia.push(m.sesgo);
  }
  const coverageMix = coverageMixFromSesgos(sesgosPorNoticia);

  const dated = arts
    .filter((a) => a.imagen_url)
    .sort((a, b) => {
      const ta = a.fecha_pub ? new Date(a.fecha_pub as string).getTime() : 0;
      const tb = b.fecha_pub ? new Date(b.fecha_pub as string).getTime() : 0;
      return tb - ta;
    });
  const heroImage = dated[0]?.imagen_url as string | undefined;

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-4">
        <Link
          href="/"
          className="text-sm font-semibold text-emerald-700 decoration-emerald-300/70 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          ← Inicio
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Comparativa · {historia.medio_count} medios · {historia.article_count}{" "}
          artículos
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {historia.titulo_canonico}
        </h1>
        {historia.resumen_canonico ? (
          <p className="max-w-3xl text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {historia.resumen_canonico}
          </p>
        ) : null}
        {heroImage ? (
          <div className="relative mt-6 max-h-[420px] overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              className="max-h-[420px] w-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}
        <div className="max-w-2xl space-y-6 pt-2">
          {coverageMix ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Cobertura por orientación (medios únicos)
              </p>
              <CoverageMixBar mix={coverageMix} />
            </div>
          ) : null}
          <BiasMeter
            position={avgPos}
            caption="Promedio orientativo del conjunto de medios (no es verificación independiente)."
          />
        </div>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Medios ordenados en el espectro (izq. → der.)
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/90 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Medio</th>
                <th className="px-4 py-3">Espectro</th>
                <th className="px-4 py-3">Titular</th>
                <th className="px-4 py-3">Publicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {artsBySpectrum.map((a) => {
                const m = medioMap.get(a.medio_id);
                return (
                  <tr key={a.id} className="bg-white dark:bg-zinc-950/20">
                    <td className="px-4 py-3">
                      {m?.slug ? (
                        <Link
                          href={`/medios/${m.slug}`}
                          className="font-semibold text-zinc-900 hover:text-emerald-800 hover:underline dark:text-zinc-100 dark:hover:text-emerald-300"
                        >
                          {m.nombre}
                        </Link>
                      ) : (
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {m?.nombre ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        {m?.sesgo ? <SesgoPill sesgo={m.sesgo} /> : null}
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {m?.sesgo ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-800 hover:underline dark:text-emerald-200"
                      >
                        {a.titulo}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
                      {formatDateTimeEs(a.fecha_pub)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Cronología
          </h2>
          <ol className="relative space-y-6 border-l border-emerald-200/80 pl-6 dark:border-emerald-900/45">
            {artsBySpectrum.map((a) => {
              const m = medioMap.get(a.medio_id);
              return (
                <li key={a.id} className="relative">
                  <div className="absolute -left-[25px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-zinc-950 dark:bg-emerald-400" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {m?.nombre} · {formatDateTimeEs(a.fecha_pub)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {a.titulo}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Ausencia de cobertura
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Medios del catálogo sin artículo enlazado a esta historia. Es una{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">
              señal de cobertura
            </strong>
            , no una explicación de motivos editoriales.
          </p>
          {ausencias.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Ningún medio activo queda fuera, o el catálogo es muy pequeño.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {ausencias.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <Link
                    href={`/medios/${m.slug}`}
                    className="font-semibold text-zinc-900 hover:text-emerald-800 hover:underline dark:text-zinc-100 dark:hover:text-emerald-300"
                  >
                    {m.nombre}
                  </Link>
                  {m.sesgo ? <SesgoPill sesgo={m.sesgo} /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
