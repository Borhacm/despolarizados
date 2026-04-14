import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { parseFeedSlugs } from "@/lib/feed-cookie";

export type FeedSource = "auth" | "cookie" | "none";

/**
 * Slugs de medios para `/feed`: si hay sesión, desde `user_feed_medios`;
 * si no, desde la cookie anónima.
 */
export async function resolveFeedMedioSlugs(
  supabase: SupabaseClient,
  user: User | null,
  feedCookieRaw: string | undefined,
): Promise<{ slugs: string[]; source: FeedSource }> {
  if (user) {
    const { data: rows, error } = await supabase
      .from("user_feed_medios")
      .select("medio_id")
      .eq("user_id", user.id);

    if (error || !rows?.length) {
      return { slugs: [], source: "auth" };
    }

    const ids = rows.map((r) => r.medio_id as string);
    const { data: medios } = await supabase
      .from("medios")
      .select("slug")
      .in("id", ids);

    const slugs = [...new Set((medios ?? []).map((m) => m.slug as string))];
    return { slugs, source: "auth" };
  }

  const slugs = parseFeedSlugs(feedCookieRaw);
  return {
    slugs,
    source: slugs.length > 0 ? "cookie" : "none",
  };
}

/** ¿El usuario sigue este medio (sesión o cookie)? */
export async function resolveFollowingMedio(
  supabase: SupabaseClient,
  user: User | null,
  medioId: string,
  medioSlug: string,
  feedCookieRaw: string | undefined,
): Promise<boolean> {
  if (user) {
    const { data } = await supabase
      .from("user_feed_medios")
      .select("medio_id")
      .eq("user_id", user.id)
      .eq("medio_id", medioId)
      .maybeSingle();
    return Boolean(data);
  }
  return parseFeedSlugs(feedCookieRaw).includes(medioSlug);
}
