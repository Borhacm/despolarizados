import { sesgoLabelShort } from "@/lib/sesgo";
import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Metodología",
  description:
    "Cómo agrupamos las noticias, cómo clasificamos a los medios y qué límites tiene Despolarizados.",
  alternates: { canonical: "/metodologia" },
};

type MedioRow = { nombre: string; slug: string; sesgo: string; ownership: string | null };

const LADOS = ["Izquierda", "Centro", "Derecha"] as const;

const h2 = "mt-12 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50";
const p = "mt-3 leading-relaxed text-zinc-700 dark:text-zinc-300";
const li = "leading-relaxed text-zinc-700 dark:text-zinc-300";
const link =
  "font-medium text-emerald-700 underline decoration-emerald-300/70 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400";

export default async function MetodologiaPage() {
  const supabase = createPublicClient();
  const { data } = supabase
    ? await supabase
        .from("medios")
        .select("nombre, slug, sesgo, ownership")
        .eq("active", true)
        .order("nombre")
    : { data: [] };
  const medios = (data ?? []) as MedioRow[];
  const porLado = new Map<string, MedioRow[]>(LADOS.map((l) => [l, []]));
  for (const m of medios) porLado.get(sesgoLabelShort(m.sesgo))?.push(m);
  const nIzq = porLado.get("Izquierda")?.length ?? 0;
  const nDer = porLado.get("Derecha")?.length ?? 0;
  const desequilibrio =
    nIzq === nDer
      ? null
      : nIzq > nDer
        ? { mas: "la izquierda", menos: "la derecha", a: nIzq, b: nDer }
        : { mas: "la derecha", menos: "la izquierda", a: nDer, b: nIzq };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 overflow-x-clip px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
        Cómo funciona
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
        Metodología
      </h1>
      <p className={p}>
        Despolarizados reúne en una sola historia las piezas que distintos medios españoles
        publican sobre el mismo hecho, y muestra qué parte del espectro editorial lo ha
        cubierto. No valoramos si una noticia es cierta ni juzgamos el trabajo de cada
        redacción: enseñamos quién informa de qué, para que puedas leer más de un lado.
      </p>

      <h2 className={h2}>De dónde salen las noticias</h2>
      <p className={p}>
        Leemos los canales RSS públicos de {medios.length} medios varias veces al día. De cada
        pieza guardamos el titular, un fragmento breve, la fecha y el enlace al original.
        Mostramos solo unas frases: para leer la noticia completa, el enlace te lleva siempre
        al medio.
      </p>
      <p className={p}>Dejamos fuera lo que no aporta a la comparación:</p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li className={li}>
          piezas de plantilla que se repiten a diario (efemérides, necrológicas, horóscopo,
          tiempo, precio de la luz, resúmenes del día);
        </li>
        <li className={li}>resultados de lotería y sorteos, salvo botes o premios noticiables;</li>
        <li className={li}>
          crónicas de fútbol, baloncesto y tenis de clubes, salvo selecciones nacionales;
        </li>
        <li className={li}>avances diarios de series de televisión.</li>
      </ul>

      <h2 className={h2}>Cómo se forma una historia</h2>
      <p className={p}>
        Cada artículo nuevo se compara con las historias abiertas por similitud de titular y
        resumen. Solo se agrupan piezas publicadas con menos de 72 horas de diferencia, y cada
        medio puede aportar como máximo dos artículos a una misma historia, para que ninguno
        pese más por publicar más veces.
      </p>
      <p className={p}>
        El agrupado es automático y se equivoca a veces: puede juntar dos hechos parecidos o
        separar dos versiones del mismo. Si ves un error, avísanos (ver Correcciones).
      </p>

      <h2 className={h2}>Cómo se calcula la cobertura</h2>
      <p className={p}>
        La barra de cada historia reparte el 100 % entre los medios distintos que la cubren
        según su orientación: izquierda, centro o derecha. Cada medio cuenta una vez, aunque
        publique varias piezas. Una historia es más relevante cuantos más medios distintos y
        más lados del espectro la cubren.
      </p>
      <p className={p}>
        <strong className="text-zinc-900 dark:text-zinc-100">Historia destacada:</strong> la
        más reciente cubierta por al menos 3 medios de al menos 2 lados.{" "}
        <strong className="text-zinc-900 dark:text-zinc-100">Ángulo muerto:</strong> historias
        de la última semana con 4 medios o más en las que un lado supone el 10 % o menos de la
        cobertura y el contrario al menos el 25 %.
      </p>

      <h2 className={h2}>Cómo clasificamos a los medios</h2>
      <p className={p}>
        La orientación de cada medio es una clasificación propia, orientativa y revisable, a
        partir de su línea editorial pública. No es una medida científica ni una verificación
        independiente, y el reparto del catálogo condiciona los resultados.
        {desequilibrio
          ? ` Hoy hay ${desequilibrio.a} medios clasificados a ${desequilibrio.mas} y ${desequilibrio.b} a ${desequilibrio.menos}, así que es más fácil que ${desequilibrio.menos} aparezca como ausente en Ángulo muerto.`
          : null}{" "}
        El listado completo está al final de esta página.
      </p>
      <p className={p}>
        El titular principal de cada historia se elige automáticamente entre los de sus
        medios según una prioridad interna del catálogo; no implica que ese medio sea más
        fiable.
      </p>

      <h2 className={h2}>Medios del catálogo</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {LADOS.map((lado) => (
          <section key={lado}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {lado} ({porLado.get(lado)?.length ?? 0})
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {(porLado.get(lado) ?? []).map((m) => (
                <li key={m.slug} className="text-zinc-700 dark:text-zinc-300">
                  <Link href={`/medios/${m.slug}`} className="hover:underline">
                    {m.nombre}
                  </Link>
                  {m.ownership ? (
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {m.ownership}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h2 className={h2}>Correcciones</h2>
      <p className={p}>
        Si crees que un medio está mal clasificado, que una historia mezcla hechos distintos o
        que falta un medio relevante, cuéntanoslo en el{" "}
        <a href="https://www.bocal.online/es/form" className={link}>
          formulario de contacto de Bocalma
        </a>
        . Despolarizados es un proyecto de{" "}
        <a href="https://www.bocal.online/es" className={link}>
          Bocalma
        </a>
        .
      </p>
    </main>
  );
}
