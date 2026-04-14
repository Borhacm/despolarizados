"use client";

import {
  FEED_COOKIE,
  parseFeedSlugs,
  serializeFeedSlugs,
} from "@/lib/feed-cookie";
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
  accountMode,
}: {
  slug: string;
  initialFollowing: boolean;
  /** true: filas en `user_feed_medios` vía API; false: cookie anónima */
  accountMode: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [following, setFollowing] = useState(initialFollowing);

  const toggle = useCallback(async () => {
    setPending(true);
    try {
      if (accountMode) {
        const res = await fetch("/api/feed/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, follow: !following }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          console.error(j.error ?? res.statusText);
          return;
        }
        setFollowing(!following);
        router.refresh();
        return;
      }

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
  }, [accountMode, following, router, slug]);

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      className={`w-full min-h-[48px] rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto sm:min-h-0 sm:py-2 ${
        following
          ? "border border-emerald-600 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/90 dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-100"
          : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      {pending ? "…" : following ? "Siguiendo" : "Seguir en Para ti"}
    </button>
  );
}
