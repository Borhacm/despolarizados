import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Entrar",
  description: "Accede con un enlace mágico enviado a tu correo.",
};

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md flex-1 overflow-x-clip px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
        Cuenta
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Entrar con correo
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Te enviamos un enlace de acceso (sin contraseña). La sesión queda en este
        navegador y tu selección de medios en <strong>Para ti</strong> se guarda
        en tu cuenta.
      </p>
      <div className="mt-8 rounded-2xl border border-emerald-200/60 bg-white p-6 shadow-sm dark:border-emerald-900/40 dark:bg-zinc-950/60">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link
          href="/feed"
          className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← Volver a Para ti
        </Link>
      </p>
    </main>
  );
}
