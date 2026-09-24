import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-base-url";

export default function robots(): MetadataRoute.Robots {
  const base = getAppBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/acceso-interno", "/api/", "/login", "/auth/", "/feed", "/baja"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
