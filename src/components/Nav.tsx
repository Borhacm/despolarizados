"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: { href: string; label: string; match: (path: string) => boolean }[] =
  [
    { href: "/", label: "Inicio", match: (p) => p === "/" },
    {
      href: "/feed",
      label: "Para ti",
      match: (p) => p.startsWith("/feed"),
    },
    {
      href: "/angulo-muerto",
      label: "Ángulo muerto",
      match: (p) => p.startsWith("/angulo-muerto"),
    },
    {
      href: "/medios",
      label: "Medios",
      match: (p) => p.startsWith("/medios"),
    },
  ];

export function Nav() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-[0_1px_0_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-start gap-3">
          <span
            className="mt-1.5 hidden h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)] sm:block"
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Despolarizados
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
              Comparar cobertura · estilo Ground News
            </span>
          </span>
        </Link>
        <nav className="flex shrink-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} active={item.match(pathname)}>
              {item.label}
            </NavLink>
          ))}
          <Link
            href="/?q="
            className="ml-0.5 inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="Buscar historias"
          >
            <svg
              className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <span className="hidden sm:inline">Buscar</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-lg bg-emerald-50 px-2.5 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/80"
          : "rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
