import { secretsMatch } from "@/lib/admin-secret";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { isEligibleForDailyDigest, madridDayKey } from "@/lib/newsletter-eligibility";
import {
  editionEmailHtml,
  isNewsletterEmailConfigured,
  sendNewsletterEmail,
  type EmailSection,
} from "@/lib/newsletter-resend";
import { fetchDailyEdition, fetchWeeklyEdition } from "@/lib/newsletter-weekly";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
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

type Edition = { subject: string; build: (unsubscribeUrl: string) => string } | null;

const DAY_MS = 86400000;
/** Resend permite 2 envíos por segundo en el plan gratuito. */
const SEND_GAP_MS = 600;

function madridWeekday(d: Date): string {
  return d.toLocaleDateString("en-GB", { timeZone: "Europe/Madrid", weekday: "long" });
}

function longDate(d: Date): string {
  return d.toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "long", year: "numeric" });
}

async function buildDaily(supabase: SupabaseClient): Promise<Edition> {
  const items = await fetchDailyEdition(supabase, new Date(Date.now() - DAY_MS).toISOString());
  if (items.length === 0) return null;
  const sections: EmailSection[] = [
    {
      heading: "Lo más cubierto en las últimas 24 horas",
      intro: "Historias que han contado dos o más medios, con el reparto de su cobertura.",
      items,
      withImages: true,
    },
  ];
  return {
    subject: "Lo más cubierto hoy en Despolarizados",
    build: (unsubscribeUrl) =>
      editionEmailHtml({
        kicker: "Resumen diario",
        title: "Las historias que más medios han contado",
        dateLabel: longDate(new Date()),
        sections,
        unsubscribeUrl,
      }),
  };
}

async function buildWeekly(supabase: SupabaseClient): Promise<Edition> {
  const { top, sinIzquierda, sinDerecha } = await fetchWeeklyEdition(supabase);
  if (top.length === 0) return null;
  const from = new Date(Date.now() - 7 * DAY_MS);
  const sections: EmailSection[] = [
    {
      heading: "Lo más cubierto de la semana",
      intro: "Las historias que más medios distintos han contado, de todos los lados del espectro.",
      items: top,
      withImages: true,
    },
    {
      heading: "La izquierda apenas lo ha contado",
      intro: "Historias con cobertura de la derecha o el centro y casi ninguna de medios de izquierda.",
      items: sinIzquierda,
    },
    {
      heading: "La derecha apenas lo ha contado",
      intro: "Historias con cobertura de la izquierda o el centro y casi ninguna de medios de derecha.",
      items: sinDerecha,
    },
  ];
  return {
    subject: "La semana en Despolarizados: lo más cubierto y lo que un lado ignoró",
    build: (unsubscribeUrl) =>
      editionEmailHtml({
        kicker: "Resumen semanal",
        title: `La semana en ${top.length} historias`,
        dateLabel: `Del ${longDate(from)} al ${longDate(new Date())}`,
        sections,
        unsubscribeUrl,
      }),
  };
}

/**
 * Cron diario (07:00 Madrid). Suscriptores diarios: una vez al día. Semanales: los lunes,
 * todos a la vez con la misma edición. `?force=1` ignora día y elegibilidad;
 * `?preview=daily|weekly` devuelve el HTML sin enviar nada.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceSend = url.searchParams.get("force") === "1" || url.searchParams.get("force") === "true";
  const preview = url.searchParams.get("preview");

  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !secretsMatch(auth ?? "", `Bearer ${secret}`)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();

  if (preview === "daily" || preview === "weekly") {
    const edition = preview === "daily" ? await buildDaily(supabase) : await buildWeekly(supabase);
    if (!edition) return NextResponse.json({ error: "Sin historias para esta edición." }, { status: 404 });
    return new NextResponse(edition.build(`${getAppBaseUrl()}/baja?token=preview`), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!isNewsletterEmailConfigured()) {
    return NextResponse.json({ error: "Falta RESEND_API_KEY para enviar correos." }, { status: 500 });
  }

  try {
    const { data: rows, error } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, frequency, verified_at, last_digest_sent_at, unsubscribe_token")
      .not("verified_at", "is", null);
    if (error) throw error;

    const now = new Date();
    const isMonday = madridWeekday(now) === "Monday";
    const base = getAppBaseUrl();
    const editions: Partial<Record<"daily" | "weekly", Edition>> = {};
    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const sub of (rows ?? []) as SubscriberRow[]) {
      const due =
        forceSend ||
        (sub.frequency === "daily"
          ? isEligibleForDailyDigest(sub.last_digest_sent_at)
          : isMonday &&
            (!sub.last_digest_sent_at || madridDayKey(new Date(sub.last_digest_sent_at)) !== madridDayKey(now)));
      if (!due) {
        skipped += 1;
        continue;
      }

      if (!(sub.frequency in editions)) {
        editions[sub.frequency] =
          sub.frequency === "daily" ? await buildDaily(supabase) : await buildWeekly(supabase);
      }
      const edition = editions[sub.frequency];
      if (!edition) {
        skipped += 1;
        continue;
      }

      const unsubscribeUrl = `${base}/baja?token=${encodeURIComponent(sub.unsubscribe_token)}`;
      const mail = await sendNewsletterEmail({
        to: sub.email,
        subject: edition.subject,
        html: edition.build(unsubscribeUrl),
        unsubscribeUrl: `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(sub.unsubscribe_token)}`,
      });
      await new Promise((r) => setTimeout(r, SEND_GAP_MS));
      if (!mail.ok) {
        errors.push(`${sub.id}: ${mail.error}`);
        continue;
      }

      const { error: upErr } = await supabase
        .from("newsletter_subscribers")
        .update({ last_digest_sent_at: now.toISOString() })
        .eq("id", sub.id);
      if (upErr) {
        errors.push(`${sub.id}: ${upErr.message}`);
        continue;
      }
      sent += 1;
    }

    return NextResponse.json({
      ok: true,
      subscribers: rows?.length ?? 0,
      sent,
      skipped,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    console.error("newsletter-digest", e);
    return NextResponse.json({ error: "Error al preparar el envío." }, { status: 500 });
  }
}
