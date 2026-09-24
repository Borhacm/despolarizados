import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Darse de baja del boletín",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ token?: string }> };

/** Confirmación de baja: el borrado solo ocurre al pulsar el botón (POST). */
export default async function BajaPage({ searchParams }: PageProps) {
  const { token = "" } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Darte de baja del boletín
      </h1>
      {token ? (
        <>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Dejarás de recibir los resúmenes de Despolarizados en este correo. Puedes volver a
            suscribirte cuando quieras.
          </p>
          <form method="post" action="/api/newsletter/unsubscribe" className="mt-6">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Confirmar la baja
            </button>
          </form>
        </>
      ) : (
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          El enlace no es válido. Usa el enlace «Darme de baja» del último correo que recibiste.
        </p>
      )}
    </main>
  );
}
