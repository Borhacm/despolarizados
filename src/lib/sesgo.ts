/**
 * Posición 0–100 en el espectro mostrado (izquierda → derecha).
 * Valores orientativos para visualización; no son verdad empírica.
 */
export function sesgoToPosition(sesgo: string): number {
  const s = sesgo.trim().toLowerCase();
  if (s.includes("izquierda") && s.includes("radical")) return 5;
  if (s.includes("pro-indep") || s.includes("indep")) return 22;
  if (s.startsWith("izquierda") || s === "izquierda") return 18;
  if (s.includes("centro-izquierda") || s.includes("centro-izq")) return 35;
  if (s.includes("centro-derecha") || s.includes("centro-der")) return 68;
  if (s.includes("derecha") && s.includes("extrema")) return 95;
  if (s.includes("liberal") && s.includes("derecha")) return 78;
  if (s.includes("derecha")) return 88;
  if (s.includes("centro")) return 52;
  if (s.includes("izq")) return 25;
  return 50;
}

export function sesgoLabelShort(sesgo: string): string {
  const p = sesgoToPosition(sesgo);
  if (p < 38) return "Izquierda";
  if (p > 62) return "Derecha";
  return "Centro";
}

/** Agrupación editorial “centro” (no izq/der) para acentos de UI en catálogo de medios. */
export function sesgoEsCentro(sesgo: string): boolean {
  return sesgoLabelShort(sesgo) === "Centro";
}
