const linkClass =
  "underline-offset-2 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 px-4 py-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p>
          Despolarizados es un proyecto de{" "}
          <a href="https://www.bocal.online/es" className={linkClass}>
            Bocalma
          </a>
          . Ver también{" "}
          <a href="https://europa.bocal.online" className={linkClass}>
            Europa en datos
          </a>
          .
        </p>
        <nav aria-label="Legal" className="flex flex-wrap gap-4">
          <a href="/metodologia" className={linkClass}>
            Metodología
          </a>
          <a href="https://www.bocal.online/es/form" className={linkClass}>
            Contacto
          </a>
          <a href="https://www.bocal.online/es/terms" className={linkClass}>
            Aviso legal
          </a>
          <a href="https://www.bocal.online/es/privacy" className={linkClass}>
            Privacidad
          </a>
          <button type="button" data-open-consent className={linkClass}>
            Preferencias de cookies
          </button>
        </nav>
      </div>
    </footer>
  );
}
