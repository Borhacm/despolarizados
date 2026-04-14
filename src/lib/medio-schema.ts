import { z } from "zod";

export const medioInsertSchema = z.object({
  nombre: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  rss_urls: z.array(z.string().url()).min(1),
  sesgo: z.string().min(1).max(120),
  factualidad: z.string().min(1).max(120),
  ownership: z.string().max(300).nullable().optional(),
  prioridad: z.number().int().min(1).max(5),
  active: z.boolean().optional(),
});

export type MedioInsert = z.infer<typeof medioInsertSchema>;

export function parseRssUrlsFromText(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
