"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ADMIN_HUB_PATH } from "@/lib/admin-hub";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/LogoMark";
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
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:min-h-0 sm:min-w-0"
        >
          {pending ? "…" : "Salir"}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 sm:min-h-0 sm:min-w-0"
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
    <header className="sticky top-0 z-50 border-b border-zinc-200/90 bg-white/90 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-[0_1px_0_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5 sm:gap-3.5"
          >
            <LogoMark
              size="nav"
              className="!h-9 !w-9 sm:!h-12 sm:!w-12"
            />
            <span className="min-w-0">
              <span className="block truncate bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-lg font-extrabold tracking-tight text-transparent dark:from-zinc-50 dark:via-zinc-100 dark:to-zinc-300 sm:text-xl">
                Despolarizados
              </span>
              <span className="mt-1 hidden max-w-[min(100%,20rem)] text-pretty text-sm font-medium leading-snug text-zinc-500 dark:text-zinc-400 sm:block">
                Agregador de noticias para evitar sesgos
              </span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-0.5 sm:hidden">
            <NavAuth userEmail={userEmail} />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:justify-end sm:gap-1">
          <nav
            className="flex min-h-[2.75rem] min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:min-h-0 sm:flex-initial sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
            aria-label="Principal"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                active={item.match(pathname)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
            <NavAuth userEmail={userEmail} />
            <ThemeToggle />
          </div>
        </div>
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
          ? "shrink-0 rounded-lg bg-emerald-50 px-2.5 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/80"
          : "shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
