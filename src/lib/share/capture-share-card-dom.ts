import { toPng } from "html-to-image";

export type CaptureShareCardOptions = {
  /** Escala respecto al nodo (p. ej. 2 → el PNG sale al doble de píxeles). */
  pixelRatio?: number;
};

/**
 * Captura un nodo DOM como PNG. Las imágenes remotas sin CORS pueden salir en blanco;
 * en ese caso conviene usar la imagen generada en servidor.
 */
export async function captureShareCardDomToPng(
  node: HTMLElement,
  options: CaptureShareCardOptions = {},
): Promise<Blob> {
  const { pixelRatio = 2 } = options;
  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: "#0a0a0a",
    filter: (el) => {
      if (!(el instanceof HTMLElement)) return true;
      return !el.dataset.htmlToImageIgnore;
    },
  });
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error("Fallo al generar PNG desde la tarjeta.");
  return res.blob();
}
