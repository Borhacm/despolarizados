-- Despolarizados — esquema inicial (embeddings: OpenAI text-embedding-3-small, 1536 dims)
-- Ejecutar en Supabase SQL Editor o con CLI.

create extension if not exists vector;

create table if not exists public.medios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  rss_urls text[] not null default '{}',
  sesgo text not null default 'desconocido',
  factualidad text not null default 'media',
  ownership text,
  prioridad int not null default 3,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists medios_nombre_key on public.medios (lower(nombre));

create table if not exists public.historias (
  id uuid primary key default gen_random_uuid(),
  titulo_canonico text not null,
  resumen_canonico text,
  embedding vector(1536),
  temas text[] not null default '{}',
  importancia numeric not null default 0,
  primera_pub timestamptz,
  ultima_pub timestamptz,
  article_count int not null default 0,
  medio_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articulos (
  id uuid primary key default gen_random_uuid(),
  historia_id uuid references public.historias (id) on delete set null,
  medio_id uuid not null references public.medios (id) on delete cascade,
  titulo text not null,
  resumen text,
  url text not null,
  fecha_pub timestamptz,
  imagen_url text,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (url)
);

create index if not exists idx_historias_importancia on public.historias (importancia desc nulls last);
create index if not exists idx_historias_ultima on public.historias (ultima_pub desc nulls last);
create index if not exists idx_articulos_historia on public.articulos (historia_id);
create index if not exists idx_articulos_medio on public.articulos (medio_id);
create index if not exists idx_articulos_fecha on public.articulos (fecha_pub desc nulls last);

alter table public.medios enable row level security;
alter table public.historias enable row level security;
alter table public.articulos enable row level security;

create policy "Lectura pública medios"
  on public.medios for select
  using (true);

create policy "Lectura pública historias"
  on public.historias for select
  using (true);

create policy "Lectura pública articulos"
  on public.articulos for select
  using (true);

-- Sin políticas de escritura para anon: la ingesta usa service role.

comment on table public.medios is 'Catálogo escalable: nuevos medios = nuevas filas + rss_urls.';
comment on column public.historias.embedding is 'Centroide (media) de embeddings de artículos del cluster.';
comment on column public.articulos.embedding is 'OpenAI text-embedding-3-small, 1536 dimensiones.';
