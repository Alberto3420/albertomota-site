-- Rascunhos de músicas (caderno de composição). Aditivo e idempotente.
create table if not exists public.music_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  melody text not null default '',
  lyrics text not null default '',
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists music_drafts_user_updated_idx on public.music_drafts (user_id, updated_at desc);

alter table public.music_drafts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'music_drafts'
      and policyname = 'music_drafts: usuario acessa os proprios rascunhos'
  ) then
    create policy "music_drafts: usuario acessa os proprios rascunhos"
      on public.music_drafts for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
