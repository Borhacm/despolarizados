import OpenAI from "openai";

const MODEL = "text-embedding-3-small";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada");
  }
  const openai = new OpenAI({ apiKey });
  const input = texts.map((t) => t.replace(/\s+/g, " ").trim().slice(0, 8000));
  const res = await openai.embeddings.create({
    model: MODEL,
    input,
  });
  return res.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding as number[]);
}

export async function embedOne(text: string): Promise<number[]> {
  const [e] = await embedTexts([text]);
  return e;
}
