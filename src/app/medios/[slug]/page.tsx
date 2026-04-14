import { BiasMeter } from "@/components/BiasMeter";
import { FollowMedioButton } from "@/components/FollowMedioButton";
import { FEED_COOKIE, parseFeedSlugs } from "@/lib/feed-cookie";
import { getMedioInitials } from "@/lib/medio-display";
import { createPublicClient } from "@/lib/supabase/public";
import { sesgoEsCentro, sesgoToPosition } from "@/lib/sesgo";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  if (!supabase) return { title: "Medio" };
  const { data } = await supabase
    .from("medios")
    .select("nombre")
    .eq("slug", slug)
    .maybeSingle();
  const n = data?.nombre as string | undefined;
  return { title: n ?? "Medio" };
}

export default async function MedioDetailPage(props: PageProps) {
  const { slug } = await props.params;
  const supabase = createPublicClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-zinc-600">
        Configura las variables de Supabase en <code>.env.local</code>.
      </div>
    );
  }

  const { data: medio, error } = await supabase
    .from("medios")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !medio) notFound();

  const jar = await cookies();
  const feedRaw = jar.get(FEED_COOKIE)?.value ?? "";
  const isFollowing = parseFeedSlugs(feedRaw).includes(slug);

  const { data: reciente } = await supabase
    .from("articulos")
    .select("id, titulo, url, fecha_pub, historia_id")
    .eq("medio_id", medio.id)
    .order("fecha_pub", { ascending: false, nullsFirst: false })
    .limit(12);

  const pos = sesgoToPosition(medio.sesgo);
  const esCentro = sesgoEsCentro(medio.sesgo);
  const hue = esCentro
    ? "from-zinc-300/95 to-zinc-500/85 dark:from-zinc-600/90 dark:to-zinc-800/90"
    : pos < 40
      ? "from-rose-400/90 to-rose-600/80"
      : pos > 60
        ? "from-sky-400/90 to-sky-600/80"
        : "from-emerald-400/90 to-teal-600/80";

  const linkAccent =
    "font-semibold decoration-zinc-300/70 underline-offset-2 hover:underline dark:text-zinc-400";
  const linkEmerald =
    "font-semibold text-emerald-700 decoration-emerald-300/70 underline-offset-2 hover:underline dark:text-emerald-400";

  const initials = getMedioInitials(medio.nombre);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/medios"
        className={`text-sm ${esCentro ? `text-zinc-600 ${linkAccent} dark:text-zinc-400` : linkEmerald}`}
      >
        ← Todos los medios
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className={`h-2 w-full bg-gradient-to-r ${hue}`} aria-hidden />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-5">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 text-2xl font-bold text-zinc-700 shadow-inner dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-200"
                aria-hidden
              >
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {medio.nombre}
                </h1>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {medio.ownership ?? "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    Sesgo: {medio.sesgo}
                  </span>
                  <span className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                    Factualidad: {medio.factualidad}
                  </span>
                  <span className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    Prioridad ingesta: {medio.prioridad}
                  </span>
                </div>
              </div>
            </div>
            <FollowMedioButton slug={slug} initialFollowing={isFollowing} />
          </div>
          <div className="mt-8 max-w-xl">
            <BiasMeter position={pos} sesgo={medio.sesgo} />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Feeds RSS
          </h2>
          <ul className="space-y-2 text-sm">
            {(medio.rss_urls as string[] | null)?.map((u) => (
              <li
                key={u}
                className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    esCentro
                      ? "break-all font-mono text-[13px] text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                      : "break-all font-mono text-[13px] text-emerald-800 hover:underline dark:text-emerald-200"
                  }
                >
                  {u}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Últimas piezas ingestadas
        </h2>
        <ul className="space-y-3">
          {(reciente ?? []).map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  esCentro
                    ? "font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-200"
                    : "font-medium text-zinc-900 hover:text-emerald-800 dark:text-zinc-100 dark:hover:text-emerald-200"
                }
              >
                {a.titulo}
              </a>
              {a.historia_id ? (
                <p className="mt-1 text-xs">
                  <Link
                    href={`/historia/${a.historia_id}`}
                    className={
                      esCentro
                        ? "text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                        : "text-emerald-700 hover:underline dark:text-emerald-400"
                    }
                  >
                    Ver historia agrupada
                  </Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        {(reciente ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aún no hay artículos. Ejecuta la ingesta (`/api/cron/ingest`).
          </p>
        ) : null}
      </section>
    </main>
  );
}
