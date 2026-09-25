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

export function buildHistoriaUrl(id: string): string {
  return `${getAppBaseUrl()}/historia/${id}`;
}

/**
 * Tokens de la web (globals.css, StoryCard, CoverageMixBar) traducidos a estilos en línea:
 * los clientes de correo no cargan hojas de estilo ni variables CSS.
 */
const T = {
  page: "#e8eaed",
  surface: "#ffffff",
  border: "#e4e4e7",
  ink: "#18181b",
  body: "#52525b",
  muted: "#71717a",
  accent: "#047857",
  accentBtn: "#059669",
  izq: "#f43f5e",
  centro: "#a1a1aa",
  der: "#0ea5e9",
  track: "#e4e4e7",
  font: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

function coverageHtml(mix: CoverageMix | null): string {
  if (!mix) return "";
  const segs = [
    [mix.izqPct, T.izq],
    [mix.centroPct, T.centro],
    [mix.derPct, T.der],
  ].filter(([pct]) => Number(pct) > 0);
  const bar = segs
    .map(([pct, color]) => `<td style="height:10px; width:${pct}%; background:${color}; font-size:0; line-height:0;">&nbsp;</td>`)
    .join("");
  const label = (name: string, pct: number, align: string) =>
    `<td style="font-size:11px; color:${T.muted}; text-align:${align}; padding-top:5px; white-space:nowrap;">${name} <span style="color:#3f3f46; font-weight:600;">${pct}%</span></td>`;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px; border-collapse:separate; border-radius:999px; overflow:hidden; background:${T.track};"><tr>${bar}</tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr>
  ${label("Izq", mix.izqPct, "left")}${label("Centro", mix.centroPct, "center")}${label("Der", mix.derPct, "right")}
</tr></table>`;
}

function shell(inner: string, footer: string): string {
  const base = getAppBaseUrl();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0; padding:0; background:${T.page}; font-family:${T.font}; color:${T.ink};">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; background:${T.page};">
    <tr><td align="center" style="padding:20px 10px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px; border-collapse:collapse;">
        <tr><td style="padding:0 4px 14px 4px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:10px;"><a href="${escapeAttribute(base)}"><img src="${escapeAttribute(base)}/apple-icon" alt="" width="40" height="40" style="display:block; border-radius:12px;" /></a></td>
            <td>
              <a href="${escapeAttribute(base)}" style="font-size:17px; font-weight:700; color:${T.ink}; text-decoration:none;">Despolarizados</a>
              <div style="font-size:12px; color:${T.muted};">Agregador de noticias para evitar sesgos</div>
            </td>
          </tr></table>
        </td></tr>
        ${inner}
        <tr><td style="padding:14px 8px 0 8px; font-size:12px; line-height:1.55; color:${T.muted};">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function card(inner: string): string {
  return `<tr><td style="padding:0 0 12px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate; background:${T.surface}; border:1px solid ${T.border}; border-radius:16px;">
    <tr><td style="padding:18px;">${inner}</td></tr>
  </table>
</td></tr>`;
}

function kicker(text: string): string {
  return `<div style="font-size:11px; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; color:${T.accent};">${escapeHtml(text)}</div>`;
}

export function verificationEmailHtml(params: { verifyUrl: string; frequencyLabel: string }): string {
  const inner = card(`
    ${kicker("Boletín")}
    <h1 style="margin:6px 0 0 0; font-size:22px; line-height:1.25; color:${T.ink};">Confirma tu suscripción</h1>
    <p style="margin:10px 0 0 0; font-size:15px; line-height:1.55; color:${T.body};">Has pedido recibir el ${escapeHtml(params.frequencyLabel)} de Despolarizados: las historias que más medios han contado y cómo se reparte su cobertura entre izquierda, centro y derecha.</p>
    <p style="margin:18px 0 4px 0;"><a href="${escapeAttribute(params.verifyUrl)}" style="display:inline-block; background:${T.accentBtn}; color:#ffffff; padding:11px 20px; border-radius:999px; font-size:14px; font-weight:600; text-decoration:none;">Confirmar suscripción</a></p>`);
  return shell(inner, "Si no has pedido esta suscripción, ignora este correo: no te enviaremos nada más.");
}

export type EmailItem = {
  url: string;
  titulo: string;
  resumen: string | null;
  imageUrl: string | null;
  medioCount: number;
  articleCount: number;
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
      ? `<a href="${escapeAttribute(i.url)}" style="display:block; margin:0 0 14px 0;"><img src="${escapeAttribute(i.imageUrl)}" alt="" width="582" style="display:block; width:100%; height:auto; border-radius:12px;" /></a>`
      : "";
  return card(`
    ${image}
    <a href="${escapeAttribute(i.url)}" style="font-size:18px; line-height:1.3; font-weight:700; color:${T.ink}; text-decoration:none;">${escapeHtml(i.titulo)}</a>
    ${i.resumen ? `<p style="margin:8px 0 0 0; font-size:14px; line-height:1.55; color:${T.body};">${escapeHtml(i.resumen)}</p>` : ""}
    ${coverageHtml(i.coverageMix)}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px; border-collapse:collapse;"><tr>
      <td><a href="${escapeAttribute(i.url)}" style="font-size:14px; font-weight:600; color:${T.accent}; text-decoration:none;">Comparar titulares &rarr;</a></td>
      <td align="right"><span style="display:inline-block; font-size:12px; color:${T.body}; border:1px solid ${T.border}; border-radius:999px; padding:3px 10px;">${i.medioCount} medios · ${i.articleCount} artículos</span></td>
    </tr></table>`);
}

/** Correo de una edición (diaria o semanal) con el mismo aspecto que la web. */
export function editionEmailHtml(params: {
  kicker: string;
  title: string;
  dateLabel: string;
  sections: EmailSection[];
  unsubscribeUrl: string;
}): string {
  const base = getAppBaseUrl();
  const intro = card(`
    ${kicker(params.kicker)}
    <h1 style="margin:6px 0 0 0; font-size:26px; line-height:1.2; color:${T.ink};">${escapeHtml(params.title)}</h1>
    <p style="margin:6px 0 0 0; font-size:13px; color:${T.muted};">${escapeHtml(params.dateLabel)}</p>`);
  const sections = params.sections
    .filter((sec) => sec.items.length > 0)
    .map(
      (sec) => `<tr><td style="padding:14px 4px 10px 4px;">
        ${kicker(sec.heading)}
        ${sec.intro ? `<div style="margin-top:4px; font-size:13px; line-height:1.45; color:${T.muted};">${escapeHtml(sec.intro)}</div>` : ""}
      </td></tr>
      ${sec.items.map((i) => itemHtml(i, Boolean(sec.withImages))).join("")}`,
    )
    .join("");
  const cta = `<tr><td align="center" style="padding:10px 0 4px 0;"><a href="${escapeAttribute(base)}" style="display:inline-block; background:${T.accentBtn}; color:#ffffff; padding:11px 22px; border-radius:999px; font-size:14px; font-weight:600; text-decoration:none;">Ver todas las historias</a></td></tr>`;
  const footer = `La orientación de cada medio es una clasificación propia y orientativa (<a href="${escapeAttribute(base)}/metodologia" style="color:${T.muted};">cómo funciona</a>). Despolarizados es un proyecto de <a href="https://www.bocal.online/es" style="color:${T.muted};">Bocalma</a>.<br /><a href="${escapeAttribute(params.unsubscribeUrl)}" style="color:${T.muted};">Darme de baja</a>`;
  return shell(intro + sections + cta, footer);
}
