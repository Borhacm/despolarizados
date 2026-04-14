/** URL pública de la app (enlaces en correos, verificación). */
export function getAppBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (explicit) {
    const u = explicit.startsWith("http") ? explicit : `https://${explicit}`;
    return u.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
