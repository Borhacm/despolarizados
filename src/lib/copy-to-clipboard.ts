/**
 * Copia texto en el mismo tick del evento de usuario (Safari/iOS y HTTP
 * locales suelen rechazar `navigator.clipboard` o perder el gesto con `async`).
 */
export function copyTextToClipboard(text: string): boolean {
  if (typeof document === "undefined") return false;

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "readonly");
  ta.style.cssText =
    "position:fixed;left:0;top:0;width:2px;height:2px;padding:0;border:0;outline:0;opacity:0;pointer-events:none;";
  document.body.appendChild(ta);

  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}
