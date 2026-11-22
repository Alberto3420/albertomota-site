-- Seção "Romance" do painel: livro, capítulos, personagens e notas. Aditivo e idempotente.
-- Acesso restrito (RLS) ao e-mail do autor.
create table if not exists public.novels (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  subtitle text not null default '',
  author text not null default '',
  logline text not null default '',
  synopsis text not null default '',
  setting text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.novel_chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels (id) on delete cascade,
  number int not null,
  title text not null default '',
  synopsis text not null default '',
  content text not null default '',
  status text not null default 'ideia',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (novel_id, number)
);

create table if not exists public.novel_characters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels (id) on delete cascade,
  position int not null default 0,
  name text not null default '',
  kind text not null default 'humano',
  breed text not null default '',
  age text not null default '',
  role text not null default '',
  chapters text not null default '',
  description text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.novel_notes (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels (id) on delete cascade,
  position int not null default 0,
  kind text not null default 'ideia',
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists novel_chapters_novel_idx on public.novel_chapters (novel_id, number);
create index if not exists novel_characters_novel_idx on public.novel_characters (novel_id, position);
create index if not exists novel_notes_novel_idx on public.novel_notes (novel_id, position);

do $$
declare t text;
begin
  foreach t in array array['novels', 'novel_chapters', 'novel_characters', 'novel_notes'] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'romance: somente o autor'
    ) then
      execute format(
        $p$create policy "romance: somente o autor" on public.%I for all
           using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'omegasist1516@gmail.com')
           with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'omegasist1516@gmail.com')$p$, t);
    end if;
  end loop;
end $$;
