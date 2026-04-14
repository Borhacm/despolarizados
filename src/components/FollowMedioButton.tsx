"use client";

import { FEED_COOKIE, parseFeedSlugs, serializeFeedSlugs } from "@/lib/feed-cookie";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const hit = document.cookie.split("; ").find((r) => r.startsWith(`${name}=`));
  if (!hit) return "";
  return decodeURIComponent(hit.slice(name.length + 1));
}

export function FollowMedioButton({
  slug,
  initialFollowing,
}: {
  slug: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [following, setFollowing] = useState(initialFollowing);

  const toggle = useCallback(() => {
    setPending(true);
    try {
      const raw = readCookie(FEED_COOKIE);
      let slugs = parseFeedSlugs(raw);
      if (following) {
        slugs = slugs.filter((s) => s !== slug);
      } else if (!slugs.includes(slug)) {
        slugs = [...slugs, slug];
      }
      const value = serializeFeedSlugs(slugs);
      document.cookie = `${FEED_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
      setFollowing(!following);
      router.refresh();
    } finally {
      setPending(false);
    }
  }, [following, router, slug]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        following
          ? "border border-emerald-600 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/90 dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-100"
          : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      {pending ? "…" : following ? "Siguiendo" : "Seguir en Mi feed"}
    </button>
  );
}
