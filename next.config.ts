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
