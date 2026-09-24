import { createHash, timingSafeEqual } from "node:crypto";

/** Comparación en tiempo constante (se comparan hashes para igualar longitudes). */
export function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Misma clave que el cron: `ADMIN_SECRET` o, si no existe, `CRON_SECRET`. */
export function verifyAdminSecret(provided: string | null | undefined): boolean {
  const expected =
    process.env.ADMIN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  if (!expected || typeof provided !== "string") return false;
  return secretsMatch(provided, expected);
}

export function hasAdminSecretConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_SECRET?.trim() || process.env.CRON_SECRET?.trim(),
  );
}
