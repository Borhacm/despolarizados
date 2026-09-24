-- Embeddings locales multilingual-e5-small (384 dimensiones) en lugar de OpenAI (1536).
-- La ingesta siempre ha agrupado en modo léxico, así que no se pierden datos útiles.
alter table public.historias alter column embedding type vector(384) using null;
alter table public.articulos alter column embedding type vector(384) using null;

-- Embedding del artículo que fundó cada historia (evita la deriva del centroide).
alter table public.historias add column if not exists seed_embedding vector(384);

comment on column public.historias.embedding is 'Centroide de los embeddings de sus artículos (multilingual-e5-small, 384 dimensiones).';
comment on column public.historias.seed_embedding is 'Embedding del artículo fundador de la historia.';
comment on column public.articulos.embedding is 'multilingual-e5-small, 384 dimensiones (prefijo «query: »).';
