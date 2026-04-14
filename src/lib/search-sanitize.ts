/** Evita comodines y caracteres que rompen filtros `ilike` en PostgREST. */
export function sanitizeSearchInput(raw: string): string {
  return raw
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export type VentanaFiltro = "all" | "24h" | "7d" | "30d";

export function ventanaToSince(ventana: string): Date | null {
  if (ventana === "24h") {
    const d = new Date();
    d.setHours(d.getHours() - 24);
    return d;
  }
  if (ventana === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (ventana === "30d") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
}
