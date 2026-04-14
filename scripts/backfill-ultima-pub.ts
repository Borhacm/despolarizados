/**
 * Rellena ultima_pub/primera_pub en historias huérfanas de fechas (útil tras ingesta antigua).
 * Uso: npm run backfill:dates
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), override: true, quiet: true });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data: rows, error } = await supabase
    .from("historias")
    .select("id")
    .is("ultima_pub", null);

  if (error) throw error;
  const ids = (rows ?? []).map((r) => r.id as string);
  let n = 0;
  for (const id of ids) {
    const { data: arts } = await supabase
      .from("articulos")
      .select("fecha_pub")
      .eq("historia_id", id);
    const dates = (arts ?? [])
      .map((a) => a.fecha_pub as string | null)
      .filter(Boolean)
      .sort() as string[];
    const now = new Date().toISOString();
    const primera = dates[0] ?? now;
    const ultima = dates[dates.length - 1] ?? now;
    const { error: up } = await supabase
      .from("historias")
      .update({ primera_pub: primera, ultima_pub: ultima })
      .eq("id", id);
    if (!up) n += 1;
  }
  console.log(JSON.stringify({ historiasSinUltima: ids.length, actualizadas: n }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
