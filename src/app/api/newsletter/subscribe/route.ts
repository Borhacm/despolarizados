import { randomTokenHex } from "@/lib/newsletter-tokens";
import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  isNewsletterEmailConfigured,
  sendNewsletterEmail,
  verificationEmailHtml,
} from "@/lib/newsletter-resend";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().max(254),
  frequency: z.enum(["daily", "weekly"]),
  /** Campo trampa: invisible para personas; si viene relleno, es un robot. */
  website: z.string().optional(),
});

const RESEND_COOLDOWN_MS = 15 * 60 * 1000;
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX_SENDS = 5;
/** Límite por IP en memoria (por instancia): frena abusos simples sin infraestructura extra. */
const sendsByIp = new Map<string, number[]>();

function ipAllowed(ip: string): boolean {
  const now = Date.now();
  const recent = (sendsByIp.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (recent.length >= IP_MAX_SENDS) {
    sendsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  sendsByIp.set(ip, recent);
  return true;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = new URL(origin).host;
    return host === request.headers.get("host") || host === new URL(getAppBaseUrl()).host;
  } catch {
    return false;
  }
}

const CHECK_INBOX_MESSAGE = "Te hemos enviado un correo. Ábrelo y pulsa el enlace para confirmar.";

function frequencyLabel(f: "daily" | "weekly"): string {
  return f === "daily" ? "resumen diario" : "resumen semanal";
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Correo o frecuencia no válidos" },
      { status: 400 },
    );
  }

  if (parsed.data.website?.trim()) {
    return NextResponse.json({ ok: true, message: CHECK_INBOX_MESSAGE });
  }

  const email = parsed.data.email.trim();
  const emailLower = email.toLowerCase();
  const { frequency } = parsed.data;

  if (!isNewsletterEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "El envío de correo no está configurado (RESEND_API_KEY). Contacta al administrador.",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createServiceClient();
    const verifyTok = randomTokenHex();
    const unsubTok = randomTokenHex();

    const { data: existing, error: findErr } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("email_lower", emailLower)
      .maybeSingle();

    if (findErr) throw findErr;

    // Ya se envió hace poco: no reenviamos (la columna existe tras la migración 20260925090000).
    const lastSent = (existing as { verification_sent_at?: string | null } | null)
      ?.verification_sent_at;
    if (!existing?.verified_at && lastSent && Date.now() - new Date(lastSent).getTime() < RESEND_COOLDOWN_MS) {
      return NextResponse.json({ ok: true, message: CHECK_INBOX_MESSAGE });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
    if (!existing?.verified_at && !ipAllowed(ip)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Prueba de nuevo dentro de un rato." },
        { status: 429 },
      );
    }

    if (existing?.verified_at) {
      return NextResponse.json({
        ok: true,
        message: "Este correo ya está suscrito y verificado.",
      });
    }

    if (existing?.id) {
      const { error: upErr } = await supabase
        .from("newsletter_subscribers")
        .update({
          email,
          frequency,
          verification_token: verifyTok,
          unsubscribe_token: unsubTok,
        })
        .eq("id", existing.id);
      if (upErr) throw upErr;
    } else {
      const { error: insErr } = await supabase
        .from("newsletter_subscribers")
        .insert({
          email,
          frequency,
          verification_token: verifyTok,
          unsubscribe_token: unsubTok,
        });
      if (insErr) throw insErr;
    }

    const base = getAppBaseUrl();
    const verifyUrl = `${base}/api/newsletter/verify?token=${encodeURIComponent(verifyTok)}`;

    const sent = await sendNewsletterEmail({
      to: email,
      subject: "Confirma tu suscripción a Despolarizados",
      html: verificationEmailHtml({
        verifyUrl,
        frequencyLabel: frequencyLabel(frequency),
      }),
    });

    if (!sent.ok) {
      console.error("newsletter subscribe: envío fallido", sent.error);
      return NextResponse.json(
        { error: "No se pudo enviar el correo de verificación." },
        { status: 502 },
      );
    }

    // Sin la migración la columna no existe: Supabase devuelve un error que ignoramos.
    await supabase
      .from("newsletter_subscribers")
      .update({ verification_sent_at: new Date().toISOString() })
      .eq("email_lower", emailLower);

    return NextResponse.json({ ok: true, message: CHECK_INBOX_MESSAGE });
  } catch (e) {
    console.error("newsletter subscribe", e);
    return NextResponse.json({ error: "No se pudo completar la suscripción." }, { status: 500 });
  }
}
