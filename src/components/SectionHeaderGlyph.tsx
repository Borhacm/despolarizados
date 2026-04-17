import type { ReactNode } from "react";

const svgProps = {
  className: "h-5 w-5 shrink-0",
  viewBox: "0 0 24 24" as const,
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Contenedor compartido con Tendencias / filtros (misma caja redondeada). */
export function SectionHeaderIconBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      aria-hidden
    >
      {children}
    </div>
  );
}

/** Tendencia / actividad (misma línea que antes). */
export function TrendingSparkGlyph() {
  return (
    <svg {...svgProps}>
      <path d="M3 17h4l3-8 4 10 3-6h4" />
    </svg>
  );
}

/** Historias / titulares — icono de periódico, misma familia de trazo que tendencias. */
export function HistoriasListGlyph() {
  return (
    <svg {...svgProps}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M18 18h-8" />
      <path d="M18 10h-8" />
      <path d="M10 6h8" />
    </svg>
  );
}
