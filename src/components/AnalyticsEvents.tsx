"use client";

import { track } from "@/lib/analytics";
import { useEffect } from "react";

/** `data-ev-medio` → `medio`: los atributos data-ev-* son los parámetros del evento. */
function paramsFrom(el: HTMLElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key === "ev" || !key.startsWith("ev") || value === undefined) continue;
    const name = key.slice(2).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, "");
    out[name] = value;
  }
  return out;
}

/**
 * Escucha global de clics y envíos marcados con `data-ev="evento"`. Así los enlaces de
 * componentes de servidor (tarjetas, fichas) se miden sin convertirlos en cliente.
 */
export function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-ev]");
      if (!el || el.tagName === "FORM") return;
      track(el.dataset.ev!, { ...paramsFrom(el), origen: window.location.pathname });
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form?.dataset?.ev) return;
      const data = new FormData(form);
      const q = String(data.get("q") ?? "").trim();
      track(form.dataset.ev, {
        con_busqueda: q.length > 0,
        medio: String(data.get("medio") ?? "") || undefined,
        orientacion: String(data.get("orientacion") ?? "") || undefined,
        ventana: String(data.get("ventana") ?? "") || undefined,
      });
      if (q) track("search", { search_term: q.slice(0, 100) });
    };
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("submit", onSubmit, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("submit", onSubmit, { capture: true });
    };
  }, []);
  return null;
}
