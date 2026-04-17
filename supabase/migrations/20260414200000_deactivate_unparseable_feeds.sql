-- NIUS: XML de feeds con atributos inválidos para el parser RSS.
-- La Voz de Galicia: /rss sirve HTML de índice, no un canal XML estable.
update public.medios
set active = false
where slug in ('nius', 'la-voz-de-galicia');
