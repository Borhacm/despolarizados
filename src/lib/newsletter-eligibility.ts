/** Comparador de día civil en Europe/Madrid (YYYY-MM-DD). */
export function madridDayKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

/** Suscriptor diario: aún no enviamos hoy (día Madrid). */
export function isEligibleForDailyDigest(lastDigestSentAt: string | null): boolean {
  if (!lastDigestSentAt) return true;
  const last = new Date(lastDigestSentAt);
  const now = new Date();
  return madridDayKey(last) !== madridDayKey(now);
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Suscriptor semanal: primera vez o han pasado ≥ 7 días desde el último envío. */
export function isEligibleForWeeklyDigest(lastDigestSentAt: string | null): boolean {
  if (!lastDigestSentAt) return true;
  const last = new Date(lastDigestSentAt).getTime();
  return Date.now() - last >= WEEK_MS;
}
