/** Iniciales para avatar (ej. "El País" → "EP", "ABC" → "AB"). */
export function getMedioInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase() || "?";
  }
  return nombre.trim().slice(0, 2).toUpperCase() || "?";
}
