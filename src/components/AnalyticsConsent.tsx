"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/*
 * Google Analytics + banner de cookies. El consentimiento se comparte con bocal.online y
 * sus subdominios: cookie `bocalma_consent` (granted|denied) en .bocal.online, misma lógica
 * que Bocalma-V0/lib/cookie-consent.ts y europa-en-datos (Consent.astro). Con el
 * consentimiento denegado, GA solo recibe mediciones sin cookies (Consent Mode v2).
 * Despolarizados mantiene su propia propiedad de GA.
 */

const GTAG_ID = "G-BJ1YBDGMN9";
const COOKIE = "bocalma_consent";
const MAX_AGE = 60 * 60 * 24 * 180;
const PRIVACY_HREF = "https://www.bocal.online/es/privacy";

type Consent = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const initScript = `
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  var m = document.cookie.match(/(?:^|; )${COOKIE}=(granted|denied)/);
  var internal = false;
  try {
    var flag = new URLSearchParams(window.location.search).get("internal");
    if (flag === "on") window.localStorage.setItem("bocalma_internal_traffic", "1");
    if (flag === "off") window.localStorage.removeItem("bocalma_internal_traffic");
    internal = window.localStorage.getItem("bocalma_internal_traffic") === "1";
  } catch (e) {}
  window.gtag("consent", "default", {
    analytics_storage: m && m[1] === "granted" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });
  window.gtag("js", new Date());
  if (internal) window.gtag("set", { traffic_type: "internal" });
  window.gtag("config", "${GTAG_ID}");
`;

function readConsent(): Consent | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(granted|denied)`));
  return m ? (m[1] as Consent) : null;
}

function writeConsent(value: Consent) {
  const domain = /(^|\.)bocal\.online$/.test(location.hostname) ? "; domain=.bocal.online" : "";
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax; Secure${domain}`;
}

export function AnalyticsConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readConsent()) setOpen(true);
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-open-consent]")) setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const decide = (value: Consent) => {
    writeConsent(value);
    window.gtag?.("consent", "update", { analytics_storage: value });
    setOpen(false);
  };

  return (
    <>
      <Script id="google-consent-default" strategy="afterInteractive">
        {initScript}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
        strategy="afterInteractive"
      />

      {open ? (
        <div
          role="region"
          aria-label="Cookies"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-zinc-700 dark:text-zinc-300">
              Usamos cookies propias necesarias y, si nos das tu consentimiento, cookies de
              Google Analytics para entender cómo se usa la web.{" "}
              <a href={PRIVACY_HREF} className="underline underline-offset-2">
                Más información
              </a>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => decide("denied")}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Solo esenciales
              </button>
              <button
                type="button"
                onClick={() => decide("granted")}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
