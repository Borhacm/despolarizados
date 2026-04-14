/** Misma clave que el cron: `ADMIN_SECRET` o, si no existe, `CRON_SECRET`. */
export function verifyAdminSecret(provided: string | null | undefined): boolean {
  const expected =
    process.env.ADMIN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  if (!expected || typeof provided !== "string") return false;
  return provided === expected;
}

export function hasAdminSecretConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_SECRET?.trim() || process.env.CRON_SECRET?.trim(),
  );
}
