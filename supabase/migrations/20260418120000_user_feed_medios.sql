-- Feed "Para ti" por usuario autenticado (Supabase Auth)

create table if not exists public.user_feed_medios (
  user_id uuid not null references auth.users (id) on delete cascade,
  medio_id uuid not null references public.medios (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, medio_id)
);

create index if not exists idx_user_feed_medios_user on public.user_feed_medios (user_id);

alter table public.user_feed_medios enable row level security;

create policy "user_feed_medios_select_own"
  on public.user_feed_medios for select
  using (auth.uid() = user_id);

create policy "user_feed_medios_insert_own"
  on public.user_feed_medios for insert
  with check (auth.uid() = user_id);

create policy "user_feed_medios_delete_own"
  on public.user_feed_medios for delete
  using (auth.uid() = user_id);

comment on table public.user_feed_medios is 'Medios seguidos en Para ti; filas por usuario autenticado.';
