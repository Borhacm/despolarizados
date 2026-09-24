import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

/** Solo historias con comparación real (2+ medios) de los últimos 30 días. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppBaseUrl();
  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/angulo-muerto`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/medios`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/metodologia`, changeFrequency: "monthly", priority: 0.5 },
  ];
  const supabase = createPublicClient();
  if (!supabase) return fixed;

  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ data: historias }, { data: medios }] = await Promise.all([
    supabase
      .from("historias")
      .select("id, ultima_pub")
      .gte("medio_count", 2)
      .gte("ultima_pub", since)
      .order("ultima_pub", { ascending: false })
      .limit(5000),
    supabase.from("medios").select("slug").eq("active", true),
  ]);

  return [
    ...fixed,
    ...(medios ?? []).map((m) => ({
      url: `${base}/medios/${m.slug as string}`,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
    ...(historias ?? []).map((h) => ({
      url: `${base}/historia/${h.id as string}`,
      lastModified: (h.ultima_pub as string | null) ?? undefined,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
