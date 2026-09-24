import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local"), override: true, quiet: true });

import type { SupabaseClient } from "@supabase/supabase-js";
import { shouldExcludeLowValueNews } from "../src/lib/ingest-relevance";
import { ingestRequiresOpenAI } from "../src/lib/ingest-mode";
import { recomputeHistoria } from "../src/lib/historia-recompute";
import { runIngest, type IngestResult } from "../src/lib/ingest";
import { createServiceClient } from "../src/lib/supabase/service";

const PAGE = 1000;
const DELETE_BATCH = 200;

type ArtRow = {
  id: string;
  titulo: string;
  resumen: string | null;
  historia_id: string | null;
};

async function pruneLowValueArticles(
  supabase: SupabaseClient,
): Promise<{ deleted: number; historiasTouched: number; historiasRemoved: number }> {
  const historiaTouched = new Set<string>();
  let deleted = 0;
  // Cursor por id: paginar por posición saltaba filas al borrar las de la página anterior.
  let lastId: string | null = null;
  for (;;) {
    let q = supabase
      .from("articulos")
      .select("id, titulo, resumen, historia_id")
      .order("id", { ascending: true })
      .limit(PAGE);
    if (lastId) q = q.gt("id", lastId);
    const { data, error } = await q;

    if (error) throw error;
    const rows = (data ?? []) as ArtRow[];
    if (rows.length === 0) break;
    lastId = rows[rows.length - 1]!.id;

    const toDelete: string[] = [];
    for (const r of rows) {
      if (shouldExcludeLowValueNews(r.titulo, r.resumen ?? "")) {
        toDelete.push(r.id);
        if (r.historia_id) historiaTouched.add(r.historia_id);
      }
    }

    for (let i = 0; i < toDelete.length; i += DELETE_BATCH) {
      const chunk = toDelete.slice(i, i + DELETE_BATCH);
      const { error: delErr } = await supabase.from("articulos").delete().in("id", chunk);
      if (delErr) throw delErr;
      deleted += chunk.length;
    }

    if (rows.length < PAGE) break;
  }

  let historiasRemoved = 0;
  for (const hid of historiaTouched) {
    const { count, error: cErr } = await supabase
      .from("articulos")
      .select("id", { count: "exact", head: true })
      .eq("historia_id", hid);
    if (cErr) throw cErr;
    if (!count) {
      const { error: hErr } = await supabase.from("historias").delete().eq("id", hid);
      if (hErr) throw hErr;
      historiasRemoved += 1;
    } else {
      await recomputeHistoria(supabase, hid);
    }
  }

  return {
    deleted,
    historiasTouched: historiaTouched.size,
    historiasRemoved,
  };
}

async function main() {
  if (ingestRequiresOpenAI() && !process.env.OPENAI_API_KEY?.trim()) {
    console.error("Modo openai: falta OPENAI_API_KEY. Usa INGEST_CLUSTER_MODE=lexical o define la clave.");
    process.exit(1);
  }
  const supabase = createServiceClient();

  console.log("[1/2] Purgando artículos con baja relevancia (mismas reglas que la ingesta)…");
  const pr = await pruneLowValueArticles(supabase);
  console.log(JSON.stringify({ step: "prune", ...pr }, null, 2));

  console.log("[2/2] Reingesta RSS (INGEST_TIME_BUDGET_MS en .env)…");
  const result: IngestResult = await runIngest(supabase, {});
  console.log(JSON.stringify({ step: "ingest", ...result }, null, 2));

  if (!result.ok) {
    console.warn(
      "Ingesta terminó con errores en algún feed (ver `errors` arriba); el resto de medios se procesó.",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
