export type MedioRow = {
  id: string;
  nombre: string;
  slug: string;
  rss_urls: string[];
  sesgo: string;
  factualidad: string;
  ownership: string | null;
  prioridad: number;
  active: boolean;
};

export type HistoriaRow = {
  id: string;
  titulo_canonico: string;
  resumen_canonico: string | null;
  temas: string[];
  importancia: number;
  primera_pub: string | null;
  ultima_pub: string | null;
  article_count: number;
  medio_count: number;
  created_at: string;
};

export type ArticuloRow = {
  id: string;
  historia_id: string | null;
  medio_id: string;
  titulo: string;
  resumen: string | null;
  url: string;
  fecha_pub: string | null;
  imagen_url: string | null;
};
