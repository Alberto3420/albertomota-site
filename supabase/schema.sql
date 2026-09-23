-- =========================================================
-- Schema para o site do Alberto Mota
-- Execute este arquivo no SQL Editor do painel do Supabase
-- (Project > SQL Editor > New query > cole tudo > Run)
-- =========================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
-- Um perfil por usuário autenticado. is_admin controla acesso ao /admin.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: leitura publica"
  on public.profiles for select
  using (true);

create policy "profiles: usuario edita o proprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: usuario cria o proprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Cria o perfil automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- MUSIC GENERATION ----------
-- Um projeto guarda o briefing; cada tentativa ou melhoria vira uma versão.
create table if not exists public.music_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  melody text not null,
  lyrics text not null,
  status text not null default 'draft' check (status in ('draft', 'payment_pending', 'queued', 'generating', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.music_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects (id) on delete cascade,
  version_number integer not null,
  melody text not null,
  lyrics text not null,
  status text not null default 'queued' check (status in ('queued', 'generating', 'ready', 'failed')),
  external_id text,
  clip_id text,
  audio_url text,
  error_message text,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

-- Mantém instalações existentes compatíveis com o id do clipe da Suno.
alter table public.music_versions add column if not exists clip_id text;

create table if not exists public.music_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.music_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'asaas' check (provider in ('asaas')),
  external_id text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'overdue', 'cancelled', 'refunded')),
  amount_cents integer not null check (amount_cents > 0),
  checkout_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.music_projects enable row level security;
alter table public.music_versions enable row level security;
alter table public.music_payments enable row level security;

create policy "music_projects: usuario acessa os proprios projetos"
  on public.music_projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "music_versions: usuario acessa as proprias versoes"
  on public.music_versions for all
  using (exists (
    select 1 from public.music_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.music_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ));

create policy "music_payments: usuario acessa os proprios pagamentos"
  on public.music_payments for select
  using (auth.uid() = user_id);

create policy "music_payments: usuario cria pagamento pendente"
  on public.music_payments for insert
  with check (auth.uid() = user_id and status = 'pending');

-- A confirmação e as atualizações de pagamentos devem ocorrer numa Edge Function,
-- depois do webhook do Asaas, nunca com a chave privada no navegador.

-- ---------- COMPOSITIONS ----------
create table if not exists public.compositions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,
  story text,
  lyrics text,
  cover_url text,
  audio_url text,
  position integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Mantém instalações existentes compatíveis com o campo de história.
alter table public.compositions add column if not exists story text;

alter table public.compositions enable row level security;

create policy "compositions: leitura publica"
  on public.compositions for select
  using (true);

create policy "compositions: admin insere"
  on public.compositions for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "compositions: admin atualiza"
  on public.compositions for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "compositions: admin exclui"
  on public.compositions for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- COMMENTS ----------
-- composition_id pode ser null (comentário geral no mural)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  composition_id uuid references public.compositions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments: leitura publica"
  on public.comments for select
  using (true);

create policy "comments: qualquer visitante pode comentar"
  on public.comments for insert
  with check (char_length(body) > 0 and char_length(body) <= 2000);

create policy "comments: admin exclui"
  on public.comments for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- LIKES ----------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  composition_id uuid not null references public.compositions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (composition_id, user_id)
);

alter table public.likes enable row level security;

create policy "likes: leitura publica"
  on public.likes for select
  using (true);

create policy "likes: usuario logado curte"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "likes: usuario logado remove a propria curtida"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ---------- FAN SUBMISSIONS ----------
create table if not exists public.fan_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  message text,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'audio', 'video', 'other')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.fan_submissions enable row level security;

create policy "fan_submissions: aprovados sao publicos"
  on public.fan_submissions for select
  using (status = 'approved' or auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  ));

create policy "fan_submissions: usuario logado envia"
  on public.fan_submissions for insert
  with check (auth.uid() = user_id);

create policy "fan_submissions: admin modera"
  on public.fan_submissions for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- STORAGE BUCKETS ----------
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('fan-uploads', 'fan-uploads', true)
on conflict (id) do nothing;

-- Leitura pública dos 3 buckets
create policy "covers: leitura publica"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "audio: leitura publica"
  on storage.objects for select
  using (bucket_id = 'audio');

create policy "fan-uploads: leitura publica"
  on storage.objects for select
  using (bucket_id = 'fan-uploads');

-- Upload de covers/audio: só admins
create policy "covers: admin faz upload"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "audio: admin faz upload"
  on storage.objects for insert
  with check (
    bucket_id = 'audio'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Upload de fan-uploads: qualquer usuário autenticado
create policy "fan-uploads: usuario logado faz upload"
  on storage.objects for insert
  with check (
    bucket_id = 'fan-uploads'
    and auth.role() = 'authenticated'
  );

-- =========================================================
-- Depois de rodar este script, torne sua própria conta admin:
--
--   update public.profiles set is_admin = true where id =
--     (select id from auth.users where email = 'seu-email@exemplo.com');
--
-- (crie sua conta pelo site em /login antes de rodar esse update)
-- =========================================================
