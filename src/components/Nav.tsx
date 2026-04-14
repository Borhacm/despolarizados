"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ADMIN_HUB_PATH } from "@/lib/admin-hub";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

function NavAuth({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = useCallback(async () => {
    setPending(true);
    try {
      const supabase = createBrowserSupabase();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
    } finally {
      setPending(false);
    }
  }, [router]);

  if (userEmail) {
    return (
      <div className="flex max-w-[min(100%,12rem)] items-center gap-2">
        <span
          className="hidden truncate text-xs text-zinc-500 dark:text-zinc-400 sm:inline"
          title={userEmail}
        >
          {userEmail}
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={pending}
          className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {pending ? "…" : "Salir"}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      aria-label="Iniciar sesión"
      title="Iniciar sesión"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20v-1a7 7 0 0 1 14 0v1" />
      </svg>
    </Link>
  );
}

export function Nav({ userEmail = null }: { userEmail?: string | null }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || !e.shiftKey || e.key.toLowerCase() !== "a") return;
      const el = e.target as HTMLElement | null;
      if (
        el?.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]',
        )
      ) {
        return;
      }
      e.preventDefault();
      router.push(ADMIN_HUB_PATH);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-[0_1px_0_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-start">
          <span className="min-w-0">
            <span className="block truncate bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-xl font-extrabold tracking-tight text-transparent dark:from-zinc-50 dark:via-zinc-100 dark:to-zinc-300">
              Despolarizados
            </span>
            <span className="mt-1 block max-w-[min(100%,20rem)] text-pretty text-sm font-medium leading-snug text-zinc-500 dark:text-zinc-400">
              Noticias para evitar sesgos
            </span>
          </span>
        </Link>
        <nav className="flex shrink-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} active={item.match(pathname)}>
              {item.label}
            </NavLink>
          ))}
          <NavAuth userEmail={userEmail} />
          <ThemeToggle />
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
