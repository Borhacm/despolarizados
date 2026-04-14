import { getAppBaseUrl } from "@/lib/app-base-url";

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
  items: { url: string; titulo: string; resumen: string | null }[];
  unsubscribeUrl: string;
}): string {
  const rows = params.items
    .map(
      (i) => `
    <li style="margin-bottom: 12px;">
      <a href="${i.url}" style="color: #059669; font-weight: 600;">${escapeHtml(
        i.titulo,
      )}</a>
      ${
        i.resumen
          ? `<div style="margin-top: 4px; color: #475569; font-size: 14px;">${escapeHtml(
              i.resumen,
            )}</div>`
          : ""
      }
    </li>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a;">
  <h1 style="font-size: 18px;">${escapeHtml(params.title)}</h1>
  <ol style="padding-left: 18px;">${rows}</ol>
  <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
    <a href="${params.unsubscribeUrl}">Darse de baja</a>
  </p>
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

export function buildHistoriaUrl(id: string): string {
  return `${getAppBaseUrl()}/historia/${id}`;
}
