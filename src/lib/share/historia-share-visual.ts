import type { CoverageMix } from "@/lib/coverage-mix";

/** Datos para la tarjeta DOM exportable (misma semántica que la ficha, sin tocar el card de lista). */
export type HistoriaShareVisualPayload = {
  coverImageUrl: string | null;
  mix: CoverageMix | null;
  medioCount: number;
  articleCount: number;
};
