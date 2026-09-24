import { ImageResponse } from "next/og";

export const alt = "Despolarizados: ve todos los lados de cada noticia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen para compartir la portada: mismo fondo y colores del espectro que las fichas. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, color: "#34d399", letterSpacing: 2 }}>DESPOLARIZADOS</div>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, marginTop: 24, maxWidth: 900 }}>
          Ve todos los lados de cada noticia
        </div>
        <div style={{ display: "flex", marginTop: 48, width: 720, height: 18, borderRadius: 9, overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#f43f5e" }} />
          <div style={{ flex: 1, background: "#71717a" }} />
          <div style={{ flex: 1, background: "#0ea5e9" }} />
        </div>
        <div style={{ fontSize: 30, color: "#a1a1aa", marginTop: 28 }}>
          La misma historia en medios de izquierda, centro y derecha
        </div>
      </div>
    ),
    size,
  );
}
