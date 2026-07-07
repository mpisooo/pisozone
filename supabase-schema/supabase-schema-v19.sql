-- ── Push subscriptions ──────────────────────────────────────────────────────
-- Salva le subscription Web Push (browser/dispositivo) di ogni utente, per
-- inviare notifiche push (promemoria, messaggi, richieste di amicizia) anche
-- ad app chiusa. L'invio effettivo avviene da funzioni server-side (Vercel)
-- con la service role key, che bypassa RLS.

create table if not exists push_subscriptions (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references profiles(id) on delete cascade not null,
  endpoint   text        unique not null,
  p256dh     text        not null,
  auth_key   text        not null,
  created_at timestamptz default now() not null
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

create policy "select own push subscriptions" on push_subscriptions
  for select using (auth.uid() = user_id);

create policy "insert own push subscriptions" on push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "delete own push subscriptions" on push_subscriptions
  for delete using (auth.uid() = user_id);
