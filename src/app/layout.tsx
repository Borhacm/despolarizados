import { Nav } from "@/components/Nav";
import { createServerSupabaseOrNull } from "@/lib/supabase/server";
import { NewsletterFlash } from "@/components/NewsletterFlash";
import { ScrollSubscribeModal } from "@/components/ScrollSubscribeModal";
import { THEME_STORAGE_KEY } from "@/lib/theme-storage";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
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
    "Noticias agrupadas desde varios medios para ver el contexto y reducir sesgos de lectura.",
};

const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseOrNull();
  let userEmail: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  }

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
        <Nav userEmail={userEmail} />
        <Suspense fallback={null}>
          <NewsletterFlash />
        </Suspense>
        <ScrollSubscribeModal />
        {children}
      </body>
    </html>
  );
}
