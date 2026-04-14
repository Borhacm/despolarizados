import { Nav } from "@/components/Nav";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f3f3f5] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <Nav />
        {children}
        <footer className="mt-auto border-t border-zinc-200/80 bg-white/60 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
          <p>
            Las etiquetas de sesgo son orientativas para la UI. MVP técnico —
            valida fuentes y términos legales antes de producción.
          </p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              href="/admin/ingesta"
              className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Ingesta (admin)
            </Link>
            <Link
              href="/admin/medios"
              className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Añadir medio (admin)
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
