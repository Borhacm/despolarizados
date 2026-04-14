/**
 * Sincroniza `MEDIOS_SEED` en Supabase (service role).
 * Uso: npm run seed:medios
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), override: true, quiet: true });

import { syncMediosSeed } from "../src/lib/sync-medios-seed";
import { createServiceClient } from "../src/lib/supabase/service";

async function main() {
  const supabase = createServiceClient();
  const { count, error } = await syncMediosSeed(supabase);
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, medios: count }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
