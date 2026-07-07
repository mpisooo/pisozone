-- ── Activity Likes ──────────────────────────────────────────────────────────

create table if not exists activity_likes (
  id          uuid        default gen_random_uuid() primary key,
  activity_id uuid        references activities(id) on delete cascade not null,
  user_id     uuid        references profiles(id)   on delete cascade not null,
  created_at  timestamptz default now()             not null,
  unique (activity_id, user_id)
);

alter table activity_likes enable row level security;

-- Tutti possono vedere i like (necessario per calcolare conteggi nel feed)
create policy "likes_select" on activity_likes
  for select using (true);

-- Ognuno può mettere like solo con il proprio user_id
create policy "likes_insert" on activity_likes
  for insert with check (auth.uid() = user_id);

-- Ognuno può togliere solo i propri like
create policy "likes_delete" on activity_likes
  for delete using (auth.uid() = user_id);
