-- Nativos digitales con peso en la conversación política (25 sept 2026). RSS comprobados.
-- Vozpópuli, CTXT y ESdiario no publican feed localizable; El Nacional.cat queda fuera
-- hasta tratar aparte el eje independentista.
insert into public.medios (nombre, slug, rss_urls, sesgo, factualidad, ownership, prioridad, active)
values
  ('The Objective', 'the-objective', array['https://theobjective.com/feed/']::text[], 'derecha', 'media', 'The Objective', 3, true),
  ('El Debate', 'el-debate', array['https://www.eldebate.com/rss/home.xml']::text[], 'derecha', 'media', 'Asociación Católica de Propagandistas', 3, true),
  ('Crónica Global', 'cronica-global', array['https://cronicaglobal.elespanol.com/rss']::text[], 'centro-derecha', 'media', 'El León de El Español', 3, true),
  ('Newtral', 'newtral', array['https://www.newtral.es/feed/']::text[], 'centro', 'media', 'Newtral Media Audiovisual', 3, true),
  ('El Salto', 'el-salto', array['https://www.elsaltodiario.com/general/feed']::text[], 'izquierda', 'media', 'Cooperativa El Salto', 3, true),
  ('La Marea', 'la-marea', array['https://www.lamarea.com/feed/']::text[], 'izquierda', 'media', 'Cooperativa Más Público', 3, true),
  ('Diario Red', 'diario-red', array['https://www.diario-red.com/rss/']::text[], 'izquierda', 'media', 'Diario Red', 3, true)
on conflict (slug) do update set
  rss_urls = excluded.rss_urls,
  sesgo = excluded.sesgo,
  ownership = excluded.ownership,
  active = true;
