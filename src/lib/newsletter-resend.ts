import { getAppBaseUrl } from "@/lib/app-base-url";
import type { CoverageMix } from "@/lib/coverage-mix";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  /** URL de baja: se añade como List-Unsubscribe (Gmail y Yahoo lo exigen en envíos masivos). */
  unsubscribeUrl?: string;
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
      ...(params.unsubscribeUrl
        ? {
            headers: {
              "List-Unsubscribe": `<${params.unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }
        : {}),
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
    ${[
      [izqPct, c.izq],
      [centroPct, c.centro],
      [derPct, c.der],
    ]
      .filter(([pct]) => Number(pct) > 0)
      .map(
        ([pct, color]) =>
          `<td style="height: 10px; width: ${pct}%; background: ${color}; font-size: 0; line-height: 0;">&nbsp;</td>`,
      )
      .join("")}
  </tr>
</table>`;
}

export function buildHistoriaUrl(id: string): string {
  return `${getAppBaseUrl()}/historia/${id}`;
}

export type EmailItem = {
  url: string;
  titulo: string;
  resumen: string | null;
  imageUrl: string | null;
  medioCount: number;
  coverageMix: CoverageMix | null;
};

export type EmailSection = {
  heading: string;
  intro?: string;
  items: EmailItem[];
  /** Imágenes solo en la sección principal: el correo pesa menos y carga antes. */
  withImages?: boolean;
};

function itemHtml(i: EmailItem, withImage: boolean): string {
  const image =
    withImage && i.imageUrl
      ? `<a href="${escapeAttribute(i.url)}" style="display:block; margin:0 0 10px 0;"><img src="${escapeAttribute(i.imageUrl)}" alt="" width="560" style="display:block; width:100%; height:auto; border-radius: 6px;" /></a>`
      : "";
  return `
  <tr>
    <td style="padding: 0 20px 18px 20px;">
      ${image}
      <a href="${escapeAttribute(i.url)}" style="font-size: 17px; line-height: 1.3; color: #111827; text-decoration: none; font-weight: 700;">${escapeHtml(i.titulo)}</a>
      ${i.resumen ? `<p style="margin: 6px 0 0 0; color: #374151; font-size: 14px; line-height: 1.45;">${escapeHtml(i.resumen)}</p>` : ""}
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">${i.medioCount} medios · <a href="${escapeAttribute(i.url)}" style="color: #047857;">Comparar titulares</a></p>
      ${coverageBarEmailHtml(i.coverageMix)}
      ${coverageChipsEmailHtml(i.coverageMix)}
    </td>
  </tr>`;
}

/** Correo de una edición (diaria o semanal) organizada por secciones. */
export function editionEmailHtml(params: {
  kicker: string;
  title: string;
  dateLabel: string;
  sections: EmailSection[];
  unsubscribeUrl: string;
}): string {
  const base = getAppBaseUrl();
  const sections = params.sections
    .filter((sec) => sec.items.length > 0)
    .map(
      (sec) => `
  <tr>
    <td style="padding: 22px 20px 10px 20px;">
      <h2 style="margin: 0; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #047857;">${escapeHtml(sec.heading)}</h2>
      ${sec.intro ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #6b7280; line-height: 1.4;">${escapeHtml(sec.intro)}</p>` : ""}
    </td>
  </tr>
  ${sec.items.map((i) => itemHtml(i, Boolean(sec.withImages))).join("")}`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 16px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; border-collapse: collapse; background: #ffffff; border-radius: 10px;">
          <tr>
            <td style="padding: 20px 20px 16px 20px; border-bottom: 1px solid #e5e7eb;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="padding-right: 10px;"><img src="${escapeAttribute(base)}/apple-icon" alt="" width="36" height="36" style="display:block; border-radius: 8px;" /></td>
                <td style="font-size: 16px; font-weight: 700; color: #111827;">Despolarizados</td>
              </tr></table>
              <p style="margin: 14px 0 0 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 700;">${escapeHtml(params.kicker)}</p>
              <h1 style="margin: 4px 0 0 0; font-size: 24px; line-height: 1.2; color: #111827;">${escapeHtml(params.title)}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #6b7280;">${escapeHtml(params.dateLabel)}</p>
            </td>
          </tr>
          ${sections}
          <tr>
            <td style="padding: 8px 20px 22px 20px;">
              <a href="${escapeAttribute(base)}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 16px; text-decoration: none; font-size: 14px; border-radius: 999px; font-weight: 700;">Ver todas las historias</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 20px 20px 20px; border-top: 1px solid #e5e7eb; font-size: 12px; line-height: 1.5; color: #6b7280;">
              La orientación de cada medio es una clasificación propia y orientativa (<a href="${escapeAttribute(base)}/metodologia" style="color: #6b7280;">cómo funciona</a>).
              Despolarizados es un proyecto de <a href="https://www.bocal.online/es" style="color: #6b7280;">Bocalma</a>.<br />
              <a href="${escapeAttribute(params.unsubscribeUrl)}" style="color: #6b7280;">Darme de baja</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
