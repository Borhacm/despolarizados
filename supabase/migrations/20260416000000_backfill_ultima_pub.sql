-- Historias sin ultima_pub quedan fuera de filtros por ventana (24h, 7d, 30d).
update public.historias h
set
  ultima_pub = coalesce(
    (select max(a.fecha_pub) from public.articulos a where a.historia_id = h.id),
    h.updated_at,
    h.created_at
  ),
  primera_pub = coalesce(
    (select min(a.fecha_pub) from public.articulos a where a.historia_id = h.id),
    h.created_at
  )
where
  h.ultima_pub is null
  and exists (select 1 from public.articulos a where a.historia_id = h.id);
