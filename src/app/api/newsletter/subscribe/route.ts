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
  email: z.string().email(),
  frequency: z.enum(["daily", "weekly"]),
});

function frequencyLabel(f: "daily" | "weekly"): string {
  return f === "daily" ? "resumen diario" : "resumen semanal";
}

export async function POST(request: Request) {
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
      .select("id, verified_at")
      .eq("email_lower", emailLower)
      .maybeSingle();

    if (findErr) throw findErr;

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
      return NextResponse.json(
        { error: sent.error || "No se pudo enviar el correo de verificación." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Te hemos enviado un correo. Ábrelo y pulsa el enlace para confirmar.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
