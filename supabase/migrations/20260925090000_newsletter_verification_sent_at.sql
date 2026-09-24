-- Cuándo se envió el último correo de verificación: evita reenviar a la misma dirección
-- en bucle (bombardeo de buzones ajenos a través del formulario).
alter table public.newsletter_subscribers
  add column if not exists verification_sent_at timestamptz;
