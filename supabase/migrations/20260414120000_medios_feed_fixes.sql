-- RTVE: feed api2 obsoleto; EFE: RSS público no fiable (HTML / XML inválido).
update public.medios
set rss_urls = array['https://www.rtve.es/rss/temas_noticias.xml']::text[]
where slug = 'rtve';

update public.medios
set active = false
where slug = 'efe';

-- La Razón: RSS portada suele devolver 404; desactivar filas semilla legacy.
update public.medios
set active = false
where slug in ('la-razon', 'larazon');
