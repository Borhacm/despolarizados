-- Búsqueda de texto completo en historias (configuración española).
-- Ejecutar en Supabase después de 20260414000000_init.sql.
-- Si tu instancia no tiene el diccionario 'spanish', cambia ambos to_tsvector a 'simple'.

alter table public.historias
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('spanish', coalesce(titulo_canonico, '')), 'A')
    || setweight(to_tsvector('spanish', coalesce(resumen_canonico, '')), 'B')
  ) stored;

create index if not exists idx_historias_search_vector
  on public.historias using gin (search_vector);

comment on column public.historias.search_vector is 'FTS (español) para búsqueda web en la UI.';
