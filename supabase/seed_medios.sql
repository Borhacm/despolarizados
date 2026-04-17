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

-- Semilla: catálogo amplio (RSS comprobados por HTTP 200; agencias suelen prioridad alta).
-- Mantén coherencia con `src/data/medios-seed.ts` (también usado por `npm run seed:medios`).

insert into public.medios (nombre, slug, rss_urls, sesgo, factualidad, ownership, prioridad, active)
values
  ('El País', 'el-pais', array['https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada']::text[], 'izquierda', 'alta', 'Prisa', 5, true),
  ('El Mundo', 'el-mundo', array['https://www.elmundo.es/rss/portada.xml']::text[], 'centro-derecha', 'alta', 'Unidad Editorial (RCS)', 5, true),
  ('ABC', 'abc', array['https://www.abc.es/rss/2.0/portada/']::text[], 'derecha', 'media-alta', 'Vocento', 5, true),
  ('La Vanguardia', 'la-vanguardia', array['https://www.lavanguardia.com/rss/home.xml']::text[], 'centro-izquierda', 'alta', 'Grupo Godó', 4, true),
  ('RTVE', 'rtve', array['https://www.rtve.es/rss/temas_noticias.xml']::text[], 'centro', 'alta', 'RTVE (pública)', 4, true),
  ('20minutos', '20minutos', array['https://www.20minutos.es/rss/']::text[], 'centro', 'media', 'Henneo', 3, true),
  ('eldiario.es', 'eldiario', array['https://www.eldiario.es/rss/']::text[], 'izquierda', 'alta', 'Cooperativa', 4, true),
  ('El Periódico', 'el-periodico', array['https://www.elperiodico.com/es/rss/rss_portada.xml']::text[], 'izquierda', 'media-alta', 'Prensa Ibérica', 3, true),
  ('El Confidencial', 'el-confidencial', array['https://www.elconfidencial.com/rss/noticias.xml']::text[], 'centro-izquierda', 'alta', 'Titania Compañía Editorial', 4, true),
  ('El Plural', 'el-plural', array['https://www.elplural.com/feed/']::text[], 'izquierda', 'media', 'El Plural', 3, true),
  ('Público', 'publico', array['https://feeds.feedburner.com/publico/portada']::text[], 'izquierda', 'alta', 'Editorial Publico S.A.', 4, true),
  ('El Español', 'el-espanol', array['https://www.elespanol.com/rss/']::text[], 'centro-derecha', 'media-alta', 'El León de El Español', 4, true),
  ('Europa Press', 'europa-press', array['https://www.europapress.es/rss/rss.aspx']::text[], 'centro', 'alta', 'Europa Press (agencia)', 4, true),
  ('Agencia EFE', 'efe', array['https://efe.com/wp-json/wp/v2/posts?per_page=30&_fields=link,title,date,excerpt']::text[], 'centro', 'alta', 'EFE (agencia)', 4, true),
  ('OKDiario', 'ok-diario', array['https://okdiario.com/feed/']::text[], 'derecha', 'media', 'OK Diario', 3, true),
  ('El Independiente', 'el-independiente', array['https://www.elindependiente.com/rss']::text[], 'centro', 'media-alta', 'El Independiente', 3, true),
  ('infoLibre', 'infolibre', array['https://www.infolibre.es/rss']::text[], 'izquierda', 'alta', 'infoLibre', 3, true),
  ('HuffPost', 'huffpost', array['https://www.huffingtonpost.es/feeds/index.xml']::text[], 'centro-izquierda', 'media', 'BuzzFeed Inc.', 3, true),
  ('Expansión', 'expansion', array['https://www.expansion.com/rss/portada.xml']::text[], 'centro-derecha', 'alta', 'Unidad Editorial', 4, true),
  ('Libertad Digital', 'libertad-digital', array['https://www.libertaddigital.com/rss/portada.xml']::text[], 'derecha', 'media', 'Libertad Digital', 3, true),
  ('La Razón', 'la-razon', array['https://www.larazon.es/?outputType=xml']::text[], 'derecha', 'media-alta', 'Grupo Planeta', 3, true),
  ('Cinco Días', 'cinco-dias', array['https://cincodias.elpais.com/rss/cincodias/portada.xml']::text[], 'centro-izquierda', 'alta', 'Prisa', 4, true),
  ('El Correo', 'el-correo', array['https://www.elcorreo.com/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Vocento', 3, true),
  ('Business Insider España', 'business-insider-es', array['https://www.businessinsider.es/rss']::text[], 'centro', 'media-alta', 'Insider Inc.', 3, true),
  ('Xataka', 'xataka', array['https://www.xataka.com/index.xml']::text[], 'centro', 'media-alta', 'Webedia', 3, true),
  ('Genbeta', 'genbeta', array['https://www.genbeta.com/index.xml']::text[], 'centro', 'media-alta', 'Webedia', 3, true),
  ('Ideal', 'ideal-granada', array['https://www.ideal.es/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Vocento', 3, true),
  ('Diario Sur', 'diario-sur', array['https://www.diariosur.es/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Prensa Ibérica', 3, true),
  ('El Comercio', 'el-comercio', array['https://www.elcomercio.es/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Prensa Ibérica', 3, true),
  ('El Norte de Castilla', 'el-norte-de-castilla', array['https://www.elnortedecastilla.es/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Vocento', 3, true),
  ('La Rioja', 'la-rioja', array['https://www.larioja.com/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Vocento', 3, true),
  ('La Gaceta de Salamanca', 'la-gaceta-de-salamanca', array['https://www.lagacetadesalamanca.es/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Vocento', 3, true),
  ('Moncloa', 'moncloa', array['https://www.moncloa.com/rss/']::text[], 'centro', 'media', 'Moncloa.com', 2, true),
  ('Canarias7', 'canarias7', array['https://www.canarias7.es/rss/atom/portada/']::text[], 'centro', 'media', 'Canarias7', 3, true),
  ('Heraldo de Aragón', 'heraldo', array['https://www.heraldo.es/rss']::text[], 'centro', 'media-alta', 'Vocento', 3, true),
  ('Levante-EMV', 'levante-emv', array['https://www.levante-emv.com/rss']::text[], 'centro', 'media-alta', 'Prensa Ibérica', 3, true),
  ('Superdeporte', 'superdeporte', array['https://www.superdeporte.es/rss']::text[], 'centro', 'media', 'Prensa Ibérica', 2, true),
  ('Málaga Hoy', 'malaga-hoy', array['https://www.malagahoy.es/rss']::text[], 'centro', 'media', 'Prensa Ibérica', 3, true),
  ('Antena 3 Noticias', 'antena3-noticias', array['https://www.antena3.com/noticias/rss/4013050.xml']::text[], 'centro', 'media-alta', 'Atresmedia', 4, true),
  ('Las Provincias', 'las-provincias', array['https://www.lasprovincias.es/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Prensa Ibérica', 3, true),
  ('El Diario Montañés', 'el-diario-montanes', array['https://www.eldiariomontanes.es/rss/atom/portada/']::text[], 'centro', 'media-alta', 'Vocento', 3, true),
  ('El Correo Gallego', 'el-correo-gallego', array['https://www.elcorreogallego.es/rss']::text[], 'centro', 'media', 'Vocento', 3, true),
  ('Faro de Vigo', 'faro-de-vigo', array['https://www.farodevigo.es/rss']::text[], 'centro', 'media-alta', 'Vocento', 3, true),
  ('La Opinión de Murcia', 'la-opinion-murcia', array['https://www.laopiniondemurcia.es/rss']::text[], 'centro', 'media', 'Prensa Ibérica', 3, true),
  ('La Opinión de Málaga', 'la-opinion-malaga', array['https://www.laopiniondemalaga.es/rss']::text[], 'centro', 'media', 'Prensa Ibérica', 3, true),
  ('Información (Alicante)', 'informacion-alicante', array['https://www.informacion.es/rss']::text[], 'centro', 'media', 'Prensa Ibérica', 3, true),
  ('El Periódico de Extremadura', 'el-periodico-extremadura', array['https://www.elperiodicoextremadura.com/rss']::text[], 'centro', 'media', 'Prensa Ibérica', 3, true),
  ('El Periódico (Cataluña)', 'el-periodico-catalunya', array['https://www.elperiodico.cat/es/rss/rss_portada.xml']::text[], 'centro-izquierda', 'media-alta', 'Prensa Ibérica', 3, true),
  ('Ara', 'ara', array['https://www.ara.cat/rss']::text[], 'centro-izquierda', 'alta', 'Editorial Ara', 4, true),
  ('Regió7', 'regio7', array['https://www.regio7.cat/rss']::text[], 'centro', 'media-alta', 'Grupo Godó', 3, true),
  ('VilaWeb', 'vilaweb', array['https://www.vilaweb.cat/rss']::text[], 'centro-izquierda', 'media', 'Partal Maresma', 3, true)
on conflict (slug) do update set
  rss_urls = excluded.rss_urls,
  sesgo = excluded.sesgo,
  factualidad = excluded.factualidad,
  ownership = excluded.ownership,
  prioridad = excluded.prioridad,
  active = excluded.active;
