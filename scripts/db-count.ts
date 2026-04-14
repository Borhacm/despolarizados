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
  const [h, a] = await Promise.all([
    supabase.from("historias").select("id", { count: "exact", head: true }),
    supabase.from("articulos").select("id", { count: "exact", head: true }),
  ]);
  console.log(
    JSON.stringify(
      {
        historias: h.count ?? 0,
        articulos: a.count ?? 0,
        errorHistorias: h.error?.message,
        errorArticulos: a.error?.message,
      },
      null,
      2,
    ),
  );
}

main().catch(console.error);
