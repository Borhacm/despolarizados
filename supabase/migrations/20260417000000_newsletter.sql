-- Suscripciones al boletín de Despolarizados (verificación por correo; envíos vía API con service role)

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_lower text generated always as (lower(trim(email))) stored,
  frequency text not null check (frequency in ('daily', 'weekly')),
  verification_token text,
  unsubscribe_token text not null,
  verified_at timestamptz,
  last_digest_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_lower_key
  on public.newsletter_subscribers (email_lower);

create index if not exists newsletter_subscribers_verified_digest
  on public.newsletter_subscribers (verified_at)
  where verified_at is not null;

alter table public.newsletter_subscribers enable row level security;

comment on table public.newsletter_subscribers is 'Suscriptores al boletín; escritura solo con service role (rutas API).';
comment on column public.newsletter_subscribers.verification_token is 'Token de un solo uso hasta verificar el correo; luego null.';
comment on column public.newsletter_subscribers.unsubscribe_token is 'Permanente para enlaces de baja en cada correo.';
comment on column public.newsletter_subscribers.last_digest_sent_at is 'Último envío de resumen; ventana de noticias = desde verified_at o este valor.';
