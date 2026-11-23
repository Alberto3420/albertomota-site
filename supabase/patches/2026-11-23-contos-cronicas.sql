-- Seção "Contos e Crônicas" do painel: obras, personagens, cenários e notas. Aditivo e idempotente.
-- Acesso restrito (RLS) ao e-mail do autor. work_id nulo = item compartilhado por todas as obras.
create table if not exists public.story_works (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  kind text not null default 'conto',
  title text not null default '',
  status text not null default 'ideia',
  theme text not null default '',
  synopsis text not null default '',
  content text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_characters (
  id uuid primary key default gen_random_uuid(),
  work_id uuid references public.story_works (id) on delete set null,
  position int not null default 0,
  name text not null default '',
  kind text not null default 'humano',
  age text not null default '',
  role text not null default '',
  description text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_settings (
  id uuid primary key default gen_random_uuid(),
  work_id uuid references public.story_works (id) on delete set null,
  position int not null default 0,
  name text not null default '',
  kind text not null default 'lugar',
  era text not null default '',
  description text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_notes (
  id uuid primary key default gen_random_uuid(),
  work_id uuid references public.story_works (id) on delete set null,
  position int not null default 0,
  kind text not null default 'ideia',
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists story_works_pos_idx on public.story_works (position);
create index if not exists story_characters_work_idx on public.story_characters (work_id, position);
create index if not exists story_settings_work_idx on public.story_settings (work_id, position);
create index if not exists story_notes_work_idx on public.story_notes (work_id, position);

do $$
declare t text;
begin
  foreach t in array array['story_works', 'story_characters', 'story_settings', 'story_notes'] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'contos: somente o autor'
    ) then
      execute format(
        $p$create policy "contos: somente o autor" on public.%I for all
           using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'omegasist1516@gmail.com')
           with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'omegasist1516@gmail.com')$p$, t);
    end if;
  end loop;
end $$;
