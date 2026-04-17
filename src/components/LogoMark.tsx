"use client";

import { BRAND_LOGO_SVG } from "@/lib/brand-logo-svg";

const SIZE = {
  /** Barra global: logo más grande junto al título */
  nav: "h-11 w-11 sm:h-12 sm:w-12",
  /** Cabeceras de sección (p. ej. Ángulo muerto) */
  page: "h-14 w-14 sm:h-16 sm:w-16",
  /** Logo junto al título de página (3× `page` en lado). */
  pageHero: "h-[10.5rem] w-[10.5rem] sm:h-[12rem] sm:w-[12rem]",
  /**
   * 450 % del logo de header (`nav`): 4.5× lado. Marca de agua (p. ej. Ángulo muerto).
   */
  pageBackdrop:
    "h-[12.375rem] w-[12.375rem] sm:h-[13.5rem] sm:w-[13.5rem]",
  /**
   * 600 % del logo de header (`nav`): 6× lado. Marca de agua en Inicio (más grande que `pageBackdrop`).
   */
  pageBackdropHome:
    "h-[16.5rem] w-[16.5rem] sm:h-[18rem] sm:w-[18rem]",
} as const;

export type LogoMarkSize = keyof typeof SIZE;

type Props = {
  /** Tamaño predefinido; por defecto barra de navegación */
  size?: LogoMarkSize;
  className?: string;
};

/**
 * Marca Despolarizados: sin fondo; trazo en `currentColor` (emerald).
 * La máscara del logo usa blanco (#fff) para la forma visible y negro (#000)
 * en las dos “D” (recortes); no sustituir esos valores por colores de tema.
 */
export function LogoMark({ size = "nav", className }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 text-emerald-600 dark:text-emerald-400 [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${SIZE[size]} ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: BRAND_LOGO_SVG }}
      aria-hidden
    />
  );
}
