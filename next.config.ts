import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  /** Los navegadores piden /favicon.ico por defecto; lo dirigimos al icono generado. */
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
  /**
   * El alias despolarizados.vercel.app servía la web entera y competía en Google con el
   * dominio propio. `/api/` queda fuera para no romper crons ni webhooks.
   */
  /**
   * Caché en la CDN de Vercel para páginas públicas (Next reescribe Cache-Control en
   * páginas dinámicas, pero no esta cabecera). Ninguna de estas rutas lee la sesión.
   */
  async headers() {
    const cdn = [
      {
        key: "Vercel-CDN-Cache-Control",
        value: "public, s-maxage=60, stale-while-revalidate=60",
      },
    ];
    // Imágenes para compartir: generarlas cuesta ~3 s; una hora de caché basta.
    const images = [
      {
        key: "Vercel-CDN-Cache-Control",
        value: "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    ];
    return [
      ...["/", "/angulo-muerto", "/medios", "/historia/:id"].map((source) => ({
        source,
        headers: cdn,
      })),
      ...[
        "/opengraph-image",
        "/historia/:id/opengraph-image",
        "/historia/:id/twitter-image",
        "/historia/:id/story-image",
      ].map((source) => ({ source, headers: images })),
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "despolarizados.vercel.app" }],
        destination: "https://despolarizados.bocal.online/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
