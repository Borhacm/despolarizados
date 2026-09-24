"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const STORAGE_KEY = "despolarizados_cookie_preferences_v1";
const GTAG_ID = "G-BJ1YBDGMN9";

type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

declare global {
  interface Window {
    gtag?: (
      command: "consent" | "config" | "js",
      targetOrDate: string | Date,
      params?: Record<string, string>,
    ) => void;
  }
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  analytics: false,
  marketing: false,
};

export function AnalyticsConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [draft, setDraft] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const hasDecision = preferences !== null;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(saved) as CookiePreferences;
      const normalized: CookiePreferences = {
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      };
      setPreferences(normalized);
      setDraft(normalized);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!preferences) return;
    if (typeof window.gtag !== "function") return;
    window.gtag("consent", "update", {
      ad_storage: preferences.marketing ? "granted" : "denied",
      analytics_storage: preferences.analytics ? "granted" : "denied",
      ad_user_data: preferences.marketing ? "granted" : "denied",
      ad_personalization: preferences.marketing ? "granted" : "denied",
    });
  }, [preferences]);

  const persistPreferences = (next: CookiePreferences) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPreferences(next);
    setDraft(next);
    setIsPanelOpen(false);
  };

  const acceptAll = () => {
    persistPreferences({ analytics: true, marketing: true });
  };

  const rejectAll = () => {
    persistPreferences({ analytics: false, marketing: false });
  };

  const saveDraft = () => {
    persistPreferences(draft);
  };

  return (
    <>
      <Script id="google-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('config', '${GTAG_ID}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
        strategy="afterInteractive"
      />

      {hydrated && !hasDecision ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Usamos cookies necesarias para que la web funcione y opcionales de
              analitica/marketing solo con tu permiso. Puedes aceptar, rechazar o
              personalizar.
            </p>
            <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/60 sm:grid-cols-3">
              <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <input type="checkbox" checked disabled className="mt-1" />
                <span>
                  <strong>Necesarias</strong>
                  <span className="block text-xs text-zinc-500">
                    Siempre activas.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      analytics: e.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>
                  <strong>Analitica</strong>
                  <span className="block text-xs text-zinc-500">
                    Medicion de uso y rendimiento.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      marketing: e.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>
                  <strong>Marketing</strong>
                  <span className="block text-xs text-zinc-500">
                    Personalizacion publicitaria.
                  </span>
                </span>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Rechazar opcionales
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Guardar seleccion
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {hydrated && hasDecision ? (
        <>
          <button
            type="button"
            onClick={() => setIsPanelOpen((v) => !v)}
            className="fixed bottom-4 left-4 z-40 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Cookies
          </button>
          {isPanelOpen ? (
            <div className="fixed bottom-16 left-4 z-50 w-[min(92vw,360px)] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Preferencias de cookies
              </p>
              <div className="mt-3 space-y-2">
                <label className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-200">
                  Analitica
                  <input
                    type="checkbox"
                    checked={draft.analytics}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        analytics: e.target.checked,
                      }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-200">
                  Marketing
                  <input
                    type="checkbox"
                    checked={draft.marketing}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        marketing: e.target.checked,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={rejectAll}
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white dark:bg-emerald-500"
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}
