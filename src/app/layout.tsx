import { Nav } from "@/components/Nav";
import { THEME_STORAGE_KEY } from "@/lib/theme-storage";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Despolarizados",
    template: "%s · Despolarizados",
  },
  description:
    "Réplica en español del concepto Ground News: mismas historias, distintas redacciones, cobertura por orientación editorial.",
};

const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Nav />
        {children}
        <footer className="mt-auto border-t border-zinc-200/80 bg-white/70 py-8 text-center text-xs text-zinc-500 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
          <p>
            Las etiquetas de sesgo son orientativas para la UI. MVP técnico —
            valida fuentes y términos legales antes de producción.
          </p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              href="/admin/ingesta"
              className="text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-emerald-800 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-emerald-300"
            >
              Ingesta (admin)
            </Link>
            <Link
              href="/admin/medios"
              className="text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-emerald-800 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-emerald-300"
            >
              Añadir medio (admin)
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
