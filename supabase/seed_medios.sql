-- =============================================================================
-- ORDEN OBLIGATORIO
-- 1) Ejecuta PRIMERO (en el mismo proyecto Supabase) TODO el contenido de:
--    supabase/migrations/20260414000000_init.sql
--    Eso crea las tablas public.medios, public.historias, public.articulos.
-- 2) Luego ejecuta ESTE archivo para insertar / actualizar los medios semilla.
-- Si ves "relation medios does not exist", el paso 1 no se ha aplicado.
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.medios') IS NULL THEN
    RAISE EXCEPTION
      'Falta la migración: ejecuta antes el archivo 20260414000000_init.sql completo (crea public.medios).';
  END IF;
END $$;

-- Semilla: ~20 medios (RSS comprobados por HTTP 200; los agencias suelen prioridad alta).
-- Mantén coherencia con `src/data/medios-seed.ts` (también usado por `npm run seed:medios`).

insert into public.medios (nombre, slug, rss_urls, sesgo, factualidad, ownership, prioridad, active)
values
  ('El País', 'el-pais', array['https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada']::text[], 'izquierda', 'alta', 'Prisa', 5, true),
  ('El Mundo', 'el-mundo', array['https://www.elmundo.es/rss/portada.xml']::text[], 'centro-derecha', 'alta', 'Unidad Editorial (RCS)', 5, true),
  ('ABC', 'abc', array['https://www.abc.es/rss/2.0/portada/']::text[], 'derecha', 'media-alta', 'Vocento', 5, true),
  ('La Vanguardia', 'la-vanguardia', array['https://www.lavanguardia.com/rss/home.xml']::text[], 'centro-izquierda', 'alta', 'Grupo Godó', 4, true),
  ('RTVE', 'rtve', array['https://api2.rtve.es/rss/temas_actualidad.xml']::text[], 'centro', 'alta', 'RTVE (pública)', 4, true),
  ('20minutos', '20minutos', array['https://www.20minutos.es/rss/']::text[], 'centro', 'media', 'Henneo', 3, true),
  ('eldiario.es', 'eldiario', array['https://www.eldiario.es/rss/']::text[], 'izquierda', 'alta', 'Cooperativa', 4, true),
  ('El Periódico', 'el-periodico', array['https://www.elperiodico.com/es/rss/rss_portada.xml']::text[], 'izquierda', 'media-alta', 'Prensa Ibérica', 3, true),
  ('El Confidencial', 'el-confidencial', array['https://www.elconfidencial.com/rss/noticias.xml']::text[], 'centro-izquierda', 'alta', 'Titania Compañía Editorial', 4, true),
  ('El Plural', 'el-plural', array['https://www.elplural.com/feed/']::text[], 'izquierda', 'media', 'El Plural', 3, true),
  ('Público', 'publico', array['https://feeds.feedburner.com/publico/portada']::text[], 'izquierda', 'alta', 'Editorial Publico S.A.', 4, true),
  ('El Español', 'el-espanol', array['https://www.elespanol.com/rss/']::text[], 'centro-derecha', 'media-alta', 'El León de El Español', 4, true),
  ('Europa Press', 'europa-press', array['https://www.europapress.es/rss/rss.aspx']::text[], 'centro', 'alta', 'Europa Press (agencia)', 4, true),
  ('Agencia EFE', 'efe', array['https://www.efe.com/efe/espana/1/rss']::text[], 'centro', 'alta', 'EFE (agencia)', 4, true),
  ('OKDiario', 'ok-diario', array['https://okdiario.com/feed/']::text[], 'derecha', 'media', 'OK Diario', 3, true),
  ('El Independiente', 'el-independiente', array['https://www.elindependiente.com/rss']::text[], 'centro', 'media-alta', 'El Independiente', 3, true),
  ('infoLibre', 'infolibre', array['https://www.infolibre.es/rss']::text[], 'izquierda', 'alta', 'infoLibre', 3, true),
  ('HuffPost', 'huffpost', array['https://www.huffingtonpost.es/feeds/index.xml']::text[], 'centro-izquierda', 'media', 'BuzzFeed Inc.', 3, true),
  ('Expansión', 'expansion', array['https://www.expansion.com/rss/portada.xml']::text[], 'centro-derecha', 'alta', 'Unidad Editorial', 4, true),
  ('Libertad Digital', 'libertad-digital', array['https://www.libertaddigital.com/rss/portada.xml']::text[], 'derecha', 'media', 'Libertad Digital', 3, true)
on conflict (slug) do update set
  rss_urls = excluded.rss_urls,
  sesgo = excluded.sesgo,
  factualidad = excluded.factualidad,
  ownership = excluded.ownership,
  prioridad = excluded.prioridad,
  active = excluded.active;
