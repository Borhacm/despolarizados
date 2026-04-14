import type { SupabaseClient } from "@supabase/supabase-js";
import { FEED_COOKIE, parseFeedSlugs } from "@/lib/feed-cookie";

/**
 * Tras login, copia slugs del cookie de feed anónimo a `user_feed_medios`.
 */
export async function mergeCookieFeedIntoUser(
  supabase: SupabaseClient,
  userId: string,
  feedCookieValue: string | undefined,
): Promise<void> {
  const slugs = parseFeedSlugs(feedCookieValue);
  if (slugs.length === 0) return;

  const { data: medios, error } = await supabase
    .from("medios")
    .select("id, slug")
    .in("slug", slugs)
    .eq("active", true);

  if (error || !medios?.length) return;

  const rows = medios.map((m) => ({
    user_id: userId,
    medio_id: m.id as string,
  }));

  await supabase.from("user_feed_medios").upsert(rows, {
    onConflict: "user_id,medio_id",
    ignoreDuplicates: true,
  });
}

export { FEED_COOKIE };
