-- La Razón: RSS oficial vía outputType=xml (el path /rss/portada devolvía 404).
-- EFE: WordPress deshabilitó feeds RSS; usamos API REST pública (la ingesta lo soporta).
update public.medios
set rss_urls = array['https://www.larazon.es/?outputType=xml']::text[],
    active = true
where slug = 'la-razon';

update public.medios
set rss_urls = array['https://efe.com/wp-json/wp/v2/posts?per_page=30&_fields=link,title,date,excerpt']::text[],
    active = true
where slug = 'efe';
