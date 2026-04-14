/** JSX para ImageResponse (@vercel/og): misma fuente visual OG + variante vertical Stories. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppBaseUrl } from "@/lib/app-base-url";
import type { CoverageMix } from "@/lib/coverage-mix";
import {
  fetchHistoriaShareFields,
  type HistoriaShareFields,
} from "@/lib/historia-share";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const STORY_SIZE = { width: 1080, height: 1920 } as const;

const TEXT = "#fafafa";
const MUTED = "#a1a1aa";
const ROSE = "#f43f5e";
const ZINC_BAR = "#71717a";
const SKY = "#0ea5e9";
const ACCENT = "#34d399";

export function truncateTitle(t: string, max = 132): string {
  const s = t.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export function truncateTitleStory(t: string, max = 96): string {
  const s = t.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export async function imageUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 1_800_000) return null;
    const ct = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const mime =
      ct.startsWith("image/") && ct !== "image/svg+xml" ? ct : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

type MixUi = {
  izq: number;
  centro: number;
  der: number;
};

function mixPercents(mix: CoverageMix): MixUi {
  return {
    izq: Math.round(mix.izqPct),
    centro: Math.round(mix.centroPct),
    der: Math.round(mix.derPct),
  };
}

function IdeologyBar({ mix }: { mix: CoverageMix }) {
  const pct = mixPercents(mix);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: MUTED,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Cobertura por orientación
      </p>
      <div
        style={{
          display: "flex",
          height: 28,
          borderRadius: 6,
          overflow: "hidden",
          width: "100%",
          background: "#27272a",
        }}
      >
        {mix.izqPct > 0 ? (
          <div
            style={{
              width: `${mix.izqPct}%`,
              height: "100%",
              background: ROSE,
            }}
          />
        ) : null}
        {mix.centroPct > 0 ? (
          <div
            style={{
              width: `${mix.centroPct}%`,
              height: "100%",
              background: ZINC_BAR,
            }}
          />
        ) : null}
        {mix.derPct > 0 ? (
          <div
            style={{
              width: `${mix.derPct}%`,
              height: "100%",
              background: SKY,
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 16,
          fontWeight: 600,
          color: MUTED,
        }}
      >
        <span>
          Izq <span style={{ color: TEXT }}>{pct.izq}%</span>
        </span>
        <span>
          Centro <span style={{ color: TEXT }}>{pct.centro}%</span>
        </span>
        <span>
          Der <span style={{ color: TEXT }}>{pct.der}%</span>
        </span>
      </div>
    </div>
  );
}

export function HistoriaShareOgLayout({
  data,
  coverDataUrl,
  host,
}: {
  data: HistoriaShareFields | null;
  coverDataUrl: string | null;
  host: string;
}) {
  const title = data?.titulo_canonico
    ? truncateTitle(data.titulo_canonico)
    : "Comparativa de medios";
  const subtitle = data
    ? `${data.medio_count} medios · ${data.article_count} artículos`
    : "Despolarizados";
  const mix = data?.mix ?? null;

  const albumSize = 472;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        background: "#0a0a0a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: 560,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #111827 0%, #020617 100%)",
        }}
      >
        {coverDataUrl ? (
          <img
            src={coverDataUrl}
            width={albumSize}
            height={albumSize}
            alt=""
            style={{
              borderRadius: 8,
              objectFit: "cover",
              boxShadow: "0 25px 50px rgba(0,0,0,0.55)",
            }}
          />
        ) : (
          <div
            style={{
              width: albumSize,
              height: albumSize,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.45)",
              color: ACCENT,
              fontSize: 120,
              fontWeight: 800,
            }}
          >
            D
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "48px 52px 44px 8px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: ACCENT,
              }}
            >
              Despolarizados
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Comparativa
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: MUTED,
            }}
          >
            {subtitle}
          </p>

          <p
            style={{
              margin: 0,
              marginTop: 8,
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.2,
              color: TEXT,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mix ? (
            <IdeologyBar mix={mix} />
          ) : (
            <p style={{ margin: 0, fontSize: 18, color: MUTED }}>
              {`Más perspectivas en ${host}`}
            </p>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: MUTED,
              }}
            >
              Abre el enlace para ver titulares y medios
            </span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: ACCENT,
              }}
            >
              {host}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 9:16 — Instagram Stories y pantalla completa móvil. */
export function HistoriaShareStoryLayout({
  data,
  coverDataUrl,
  host,
}: {
  data: HistoriaShareFields | null;
  coverDataUrl: string | null;
  host: string;
}) {
  const title = data?.titulo_canonico
    ? truncateTitleStory(data.titulo_canonico)
    : "Comparativa de medios";
  const subtitle = data
    ? `${data.medio_count} medios · ${data.article_count} artículos`
    : "Despolarizados";
  const mix = data?.mix ?? null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: "100%",
          height: 1040,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #111827 0%, #020617 100%)",
        }}
      >
        {coverDataUrl ? (
          <img
            src={coverDataUrl}
            alt=""
            width={980}
            height={980}
            style={{
              borderRadius: 12,
              objectFit: "cover",
              boxShadow: "0 25px 60px rgba(0,0,0,0.55)",
            }}
          />
        ) : (
          <div
            style={{
              width: 980,
              height: 980,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.45)",
              color: ACCENT,
              fontSize: 220,
              fontWeight: 800,
            }}
          >
            D
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "40px 44px 48px",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: ACCENT,
              }}
            >
              Despolarizados
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Comparativa
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              color: MUTED,
            }}
          >
            {subtitle}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.22,
              color: TEXT,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </p>
        </div>

        {mix ? (
          <IdeologyBar mix={mix} />
        ) : (
          <p style={{ margin: 0, fontSize: 22, color: MUTED }}>
            {`Comparativa en ${host}`}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid #27272a",
            paddingTop: 20,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: MUTED,
              maxWidth: "62%",
              lineHeight: 1.35,
            }}
          >
            Enlace en biografía o leyenda — abre la comparativa completa
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: ACCENT,
            }}
          >
            {host}
          </span>
        </div>
      </div>
    </div>
  );
}

export async function loadHistoriaShareImageData(
  supabase: SupabaseClient | null,
  id: string,
): Promise<{
  data: HistoriaShareFields | null;
  coverDataUrl: string | null;
  host: string;
}> {
  const data = supabase ? await fetchHistoriaShareFields(supabase, id) : null;
  const coverDataUrl =
    data?.cover_image_url && data.cover_image_url.startsWith("http")
      ? await imageUrlToDataUrl(data.cover_image_url)
      : null;

  let host = "despolarizados.es";
  try {
    host = new URL(getAppBaseUrl()).host;
  } catch {
    /* keep default */
  }

  return { data, coverDataUrl, host };
}
