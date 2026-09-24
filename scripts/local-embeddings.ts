/**
 * Embeddings multilingües locales (multilingual-e5-small, 384 dimensiones) calculados en
 * un proceso hijo (`embed-child.ts`). Vive fuera de `src/` a propósito: solo lo usan los
 * scripts (GitHub Actions); si lo importara una ruta de Next, el modelo y onnxruntime
 * entrarían en las funciones de Vercel y superarían su tamaño máximo.
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolve } from "node:path";
import { createInterface } from "node:readline";

let child: ChildProcessWithoutNullStreams | null = null;
let nextId = 0;
const pending = new Map<number, { ok: (e: number[][]) => void; fail: (err: Error) => void }>();

function ensureChild(): ChildProcessWithoutNullStreams {
  if (child) return child;
  const script = resolve(__dirname, "embed-child.ts");
  child = spawn(process.execPath, ["--import", "tsx", script], {
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stderr.on("data", (d: Buffer) => {
    const msg = d.toString();
    if (!/^dtype|mutex lock failed/.test(msg)) process.stderr.write(msg);
  });
  createInterface({ input: child.stdout }).on("line", (line) => {
    const msg = JSON.parse(line) as { id: number; embs?: number[][]; error?: string };
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error || !msg.embs) p.fail(new Error(msg.error ?? "sin embeddings"));
    else p.ok(msg.embs);
  });
  child.on("exit", (code) => {
    for (const p of pending.values()) p.fail(new Error(`proceso de embeddings terminado (${code})`));
    pending.clear();
    child = null;
  });
  return child;
}

export function embedTextsLocal(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return Promise.resolve([]);
  const c = ensureChild();
  const id = nextId++;
  return new Promise((ok, fail) => {
    pending.set(id, { ok, fail });
    c.stdin.write(`${JSON.stringify({ id, texts })}\n`);
  });
}

/** Cierra el proceso hijo; así el script principal termina limpio. */
export async function disposeLocalEmbeddings(): Promise<void> {
  if (!child) return;
  child.kill("SIGKILL");
  child = null;
}
