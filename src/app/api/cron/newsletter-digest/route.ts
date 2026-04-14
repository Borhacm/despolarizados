import {
  isEligibleForDailyDigest,
  isEligibleForWeeklyDigest,
} from "@/lib/newsletter-eligibility";
import {
  digestWindowStartIso,
  fetchHistoriasCargadasDesde,
} from "@/lib/newsletter-digest";
import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  digestEmailHtml,
  isNewsletterEmailConfigured,
  sendNewsletterEmail,
} from "@/lib/newsletter-resend";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

type SubscriberRow = {
  id: string;
  email: string;
  frequency: "daily" | "weekly";
  verified_at: string;
  last_digest_sent_at: string | null;
  unsubscribe_token: string;
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isNewsletterEmailConfigured()) {
    return NextResponse.json(
      { error: "Falta RESEND_API_KEY para enviar correos." },
      { status: 500 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from("newsletter_subscribers")
      .select(
        "id, email, frequency, verified_at, last_digest_sent_at, unsubscribe_token",
      )
      .not("verified_at", "is", null);

    if (error) throw error;

    const list = (rows ?? []) as SubscriberRow[];
    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    const base = getAppBaseUrl();

    for (const sub of list) {
      const eligible =
        sub.frequency === "daily"
          ? isEligibleForDailyDigest(sub.last_digest_sent_at)
          : isEligibleForWeeklyDigest(sub.last_digest_sent_at);

      if (!eligible) {
        skipped += 1;
        continue;
      }

      const sinceIso = digestWindowStartIso({
        lastDigestSentAt: sub.last_digest_sent_at,
        verifiedAt: sub.verified_at,
      });

      let items;
      try {
        items = await fetchHistoriasCargadasDesde(supabase, sinceIso);
      } catch (e) {
        errors.push(
          `${sub.email}: ${e instanceof Error ? e.message : String(e)}`,
        );
        continue;
      }

      if (items.length === 0) {
        skipped += 1;
        continue;
      }

      const title =
        sub.frequency === "daily"
          ? "Noticias nuevas en Despolarizados (diario)"
          : "Noticias nuevas en Despolarizados (semanal)";

      const unsubUrl = `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(
        sub.unsubscribe_token,
      )}`;

      const mail = await sendNewsletterEmail({
        to: sub.email,
        subject:
          sub.frequency === "daily"
            ? "Despolarizados — resumen del día"
            : "Despolarizados — resumen semanal",
        html: digestEmailHtml({
          title,
          items: items.map((i) => ({
            url: i.url,
            titulo: i.titulo,
            resumen: i.resumen,
          })),
          unsubscribeUrl: unsubUrl,
        }),
      });

      if (!mail.ok) {
        errors.push(`${sub.email}: ${mail.error}`);
        continue;
      }

      const { error: upErr } = await supabase
        .from("newsletter_subscribers")
        .update({ last_digest_sent_at: new Date().toISOString() })
        .eq("id", sub.id);

      if (upErr) {
        errors.push(`${sub.email}: ${upErr.message}`);
        continue;
      }

      sent += 1;
    }

    return NextResponse.json({
      ok: true,
      subscribers: list.length,
      sent,
      skipped,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
