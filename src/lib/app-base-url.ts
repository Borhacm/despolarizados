/**
 * URL pública canónica (enlaces compartidos, OG, correos).
 *
 * En Vercel, `VERCEL_URL` es el host de *este* deploy (a veces un URL de preview
 * “privado”). Para producción estable usar:
 * - `NEXT_PUBLIC_APP_URL` = dominio público (recomendado: `https://…vercel.app` o dominio propio)
 * - o dejar que use `VERCEL_PROJECT_PRODUCTION_URL` en deploys con `VERCEL_ENV=production`.
 */
function normalizeBase(raw: string): string {
  const t = raw.trim().replace(/\/$/, "");
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return normalizeBase(explicit);
  }

  const vercelEnv = process.env.VERCEL_ENV;
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (vercelEnv === "production" && productionHost) {
    return normalizeBase(
      productionHost.startsWith("http") ? productionHost : `https://${productionHost}`,
    );
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}
