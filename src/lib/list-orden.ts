export type ListOrden = "importancia" | "reciente";

export function parseListOrden(raw: string | undefined): ListOrden {
  return raw === "reciente" ? "reciente" : "importancia";
}
