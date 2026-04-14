import { isMobileShareContext } from "@/lib/share/mobile-instagram-share";

/**
 * Copia la URL, intenta `navigator.share` con el PNG y, si no, descarga.
 * En móvil prueba varias variantes de `ShareData` para maximizar compatibilidad con Instagram en el sheet.
 */
export async function sharePngBlobWithWebShareOrDownload(input: {
  blob: Blob;
  fileName: string;
  title: string;
  caption: string;
  url: string;
  copyUrlToClipboard: () => Promise<boolean>;
}): Promise<"shared" | "downloaded" | "cancelled"> {
  const { blob, fileName, title, caption, url, copyUrlToClipboard } = input;
  const file = new File([blob], fileName, { type: "image/png" });
  const mobile = isMobileShareContext();

  await copyUrlToClipboard();

  const tryShare = async (payload: ShareData) => {
    if (typeof navigator === "undefined" || !navigator.share) return false;
    try {
      await navigator.share(payload);
      return true;
    } catch (e) {
      const err = e as { name?: string };
      if (err?.name === "AbortError") return null;
      return false;
    }
  };

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: [file] })
  ) {
    if (mobile) {
      const r1 = await tryShare({
        files: [file],
        title,
        text: caption,
      });
      if (r1 === null) return "cancelled";
      if (r1) return "shared";

      const r2 = await tryShare({ files: [file], title });
      if (r2 === null) return "cancelled";
      if (r2) return "shared";

      const r3 = await tryShare({
        files: [file],
        title,
        text: `${caption}\n${url}`,
      });
      if (r3 === null) return "cancelled";
      if (r3) return "shared";
    } else {
      const r = await tryShare({
        files: [file],
        title,
        text: caption,
        url,
      });
      if (r === null) return "cancelled";
      if (r) return "shared";
    }
  }

  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(href);
  return "downloaded";
}
