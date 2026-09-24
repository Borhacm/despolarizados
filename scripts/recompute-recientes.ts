import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), override: true, quiet: true });

import { recomputeHistoria } from "../src/lib/historia-recompute";
import { createServiceClient } from "../src/lib/supabase/service";

/**
 * Recalcula contadores e importancia (fórmula por medios y lados) de las historias
 * activas en los últimos N días. Uso: npm run recompute:recientes -- 14
 */
async function main() {
  const days = Number.parseInt(process.argv[2] ?? "14", 10);
  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  let from = 0;
  let done = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("historias")
      .select("id")
      .gte("ultima_pub", since)
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    const ids = (data ?? []).map((r) => r.id as string);
    for (const id of ids) {
      await recomputeHistoria(supabase, id);
      done += 1;
      if (done % 250 === 0) console.log(`${done} historias recalculadas…`);
    }
    if (ids.length < 1000) break;
    from += 1000;
  }
  console.log(`Listo: ${done} historias de los últimos ${days} días.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
