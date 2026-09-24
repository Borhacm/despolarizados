import { getAppBaseUrl } from "@/lib/app-base-url";
import type { CoverageMix } from "@/lib/coverage-mix";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

const RESEND_API = "https://api.resend.com/emails";

export function isNewsletterEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress(): string {
  const raw = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (raw) return raw;
  return "Despolarizados <onboarding@resend.dev>";
}

export async function sendNewsletterEmail(
  params: SendEmailParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "Falta RESEND_API_KEY en el servidor." };
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: text || `Resend HTTP ${res.status}`,
    };
  }

  return { ok: true };
}

export function verificationEmailHtml(params: {
  verifyUrl: string;
  frequencyLabel: string;
}): string {
  const { verifyUrl, frequencyLabel } = params;
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
  <p>Confirma tu suscripción a <strong>Despolarizados</strong> (${frequencyLabel}).</p>
  <p><a href="${verifyUrl}" style="color: #059669;">Verificar correo</a></p>
  <p style="font-size: 12px; color: #64748b;">Si no pediste esto, ignora este mensaje.</p>
</body>
</html>`;
}

export function digestEmailHtml(params: {
  title: string;
  items: {
    url: string;
    titulo: string;
    resumen: string | null;
    imageUrl: string | null;
    coverageMix: CoverageMix | null;
  }[];
  unsubscribeUrl: string;
}): string {
  const todayLabel = new Date().toLocaleDateString("es-ES", {
    timeZone: "Europe/Madrid",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rows = params.items
    .map(
      (i) => `
  <tr>
    <td style="padding: 0 14px 10px 14px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate; border-spacing: 0; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 10px;">
        <tr>
          <td style="padding: 10px 10px 9px 10px;">
            ${
              i.imageUrl
                ? `<a href="${escapeAttribute(i.url)}" style="display:block; margin:0 0 8px 0;">
              <img
                src="${escapeAttribute(i.imageUrl)}"
                alt="${escapeAttribute(i.titulo)}"
                width="560"
                style="display:block; width:100%; height:auto; border: 1px solid #d1d5db; border-radius: 6px;"
              />
            </a>`
                : ""
            }
            <a href="${escapeAttribute(i.url)}" style="font-size: 17px; line-height: 1.2; color: #111827; text-decoration: none; font-weight: 700;">
              ${escapeHtml(i.titulo)}
            </a>
            <p style="margin: 6px 0 0 0; color: #374151; font-size: 12px; line-height: 1.33;">
              ${escapeHtml(compactExcerpt(i.resumen))}
            </p>
            ${coverageBarEmailHtml(i.coverageMix)}
            ${coverageChipsEmailHtml(i.coverageMix)}
          </td>
        </tr>
      </table>
    </td>
  </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin: 0; padding: 0; background: #e5e7eb; font-family: Arial, Helvetica, sans-serif; color: #111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 12px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; border-collapse: collapse; background: #ffffff; border: 1px solid #bfc5ce;">
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #d1d5db; background: #f3f4f6;">
              <img
                src="${escapeAttribute(getAppBaseUrl())}/logo.svg"
                alt="Despolarizados"
                width="156"
                height="26"
                style="display: block; height: auto; border: 0; margin: 0 0 7px 0;"
              />
              <p style="margin: 0; font-size: 11px; color: #6b7280; font-weight: 700; letter-spacing: 0.02em;">
                Despolarizados Digest
              </p>
              <h1 style="margin: 4px 0 0 0; font-size: 22px; line-height: 1.12; color: #047857;">
                ${escapeHtml(params.title)}
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
                ${escapeHtml(todayLabel)}
              </p>
            </td>
          </tr>
          ${rows}
          <tr>
            <td style="padding: 4px 14px 12px 14px;">
              <a href="${escapeAttribute(
                getAppBaseUrl(),
              )}" style="display: inline-block; border: 1px solid #111827; background: #111827; color: #ffffff; padding: 7px 12px; text-decoration: none; font-size: 12px; border-radius: 3px; font-weight: 700;">
                Ver portada
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 14px 12px 14px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #6b7280;">
                Si no quieres recibir este correo, puedes
                <a href="${escapeAttribute(params.unsubscribeUrl)}" style="color: #6b7280; text-decoration: underline;">darte de baja aquí</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function compactExcerpt(resumen: string | null): string {
  const raw = (resumen ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return "Sin resumen disponible.";
  const MAX = 180;
  if (raw.length <= MAX) return raw;
  return `${raw.slice(0, MAX - 1).trimEnd()}...`;
}

/** Misma paleta que `CoverageMixBar` / OG (`historia-share-image`). */
const COVERAGE_EMAIL = {
  izq: "#f43f5e",
  centro: "#a1a1aa",
  der: "#0ea5e9",
  track: "#e4e4e7",
} as const;

function coverageChipsEmailHtml(mix: CoverageMix | null): string {
  if (!mix) return "";
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 8px; border-collapse: separate; border-spacing: 4px 0;">
  <tr>
    <td style="font-size: 10px; color: #881337; background: #ffe4e6; border: 1px solid #fecdd3; border-radius: 2px; padding: 2px 5px; white-space: nowrap; font-weight: 700;">
      Izq ${mix.izqPct}%
    </td>
    <td style="font-size: 10px; color: #3f3f46; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 2px; padding: 2px 5px; white-space: nowrap; font-weight: 700;">
      Centro ${mix.centroPct}%
    </td>
    <td style="font-size: 10px; color: #0c4a6e; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 2px; padding: 2px 5px; white-space: nowrap; font-weight: 700;">
      Der ${mix.derPct}%
    </td>
  </tr>
</table>`;
}

function coverageBarEmailHtml(mix: CoverageMix | null): string {
  if (!mix) return "";
  const { izqPct, centroPct, derPct } = mix;
  const c = COVERAGE_EMAIL;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 8px; border-collapse: collapse; border: 1px solid #d4d4d8; border-radius: 9999px; overflow: hidden; background: ${c.track};">
  <tr>
    <td style="height: 10px; width: ${izqPct}%; background: ${c.izq}; font-size: 0; line-height: 0;">&nbsp;</td>
    <td style="height: 10px; width: ${centroPct}%; background: ${c.centro}; font-size: 0; line-height: 0;">&nbsp;</td>
    <td style="height: 10px; width: ${derPct}%; background: ${c.der}; font-size: 0; line-height: 0;">&nbsp;</td>
  </tr>
</table>`;
}

export function buildHistoriaUrl(id: string): string {
  return `${getAppBaseUrl()}/historia/${id}`;
}
