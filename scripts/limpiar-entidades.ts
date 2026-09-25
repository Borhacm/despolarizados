import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), override: true, quiet: true });

import { decodeHtmlEntities } from "../src/lib/html-entities";
import { createServiceClient } from "../src/lib/supabase/service";

/** Decodifica entidades HTML (&quot;, &#8230;…) en titulares y resúmenes ya guardados. */
async function main() {
  const sb = createServiceClient();
  let fixed = 0;
  for (const col of ["titulo", "resumen"] as const) {
    for (;;) {
      const { data, error } = await sb
        .from("articulos")
        .select(`id, ${col}`)
        .like(col, "%&%;%")
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Record<string, string | null>[];
      const changes = rows
        .map((r) => ({ id: r.id as string, before: r[col] ?? "", after: decodeHtmlEntities(r[col] ?? "") }))
        .filter((r) => r.after !== r.before);
      if (changes.length === 0) break;
      for (const c of changes) {
        const { error: upErr } = await sb.from("articulos").update({ [col]: c.after }).eq("id", c.id);
        if (upErr) throw upErr;
        fixed += 1;
      }
      console.log(`${col}: ${fixed} corregidos…`);
      if (changes.length < rows.length) break;
    }
  }
  console.log(`Listo: ${fixed} campos corregidos.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
