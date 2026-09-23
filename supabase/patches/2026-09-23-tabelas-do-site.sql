-- =========================================================
-- Patch: cria só o que FALTA no projeto Supabase compartilhado (vszdpaithvzsuheaftek).
-- Estado verificado em 2026-09-23:
--   * já existem: profiles (de outro app: id, created_at, email, nome), music_projects,
--     music_versions, music_payments  -> NÃO são recriadas aqui
--   * faltam: compositions, comments, likes, fan_submissions, colunas display_name/is_admin
--     em profiles e os buckets covers/audio/fan-uploads
-- É idempotente (pode rodar mais de uma vez) e só ADICIONA coisas: nada é apagado ou alterado
-- nas tabelas existentes, exceto o acréscimo de 2 colunas opcionais em public.profiles.
-- Rode no painel: Supabase > SQL Editor > New query > cole tudo > Run.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES (tabela já existente; só acrescenta as colunas que o site usa) ----------
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- O site precisa ler o próprio perfil (para saber se é admin). Política extra, só de leitura.
alter table public.profiles enable row level security;

drop policy if exists "site: usuario le o proprio perfil" on public.profiles;
create policy "site: usuario le o proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

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

alter table public.compositions enable row level security;

drop policy if exists "compositions: leitura publica" on public.compositions;
create policy "compositions: leitura publica"
  on public.compositions for select
  using (true);

drop policy if exists "compositions: admin insere" on public.compositions;
create policy "compositions: admin insere"
  on public.compositions for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "compositions: admin atualiza" on public.compositions;
create policy "compositions: admin atualiza"
  on public.compositions for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "compositions: admin exclui" on public.compositions;
create policy "compositions: admin exclui"
  on public.compositions for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- COMMENTS ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  composition_id uuid references public.compositions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "comments: leitura publica" on public.comments;
create policy "comments: leitura publica"
  on public.comments for select
  using (true);

drop policy if exists "comments: qualquer visitante pode comentar" on public.comments;
create policy "comments: qualquer visitante pode comentar"
  on public.comments for insert
  with check (char_length(body) > 0 and char_length(body) <= 2000);

drop policy if exists "comments: admin exclui" on public.comments;
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

drop policy if exists "likes: leitura publica" on public.likes;
create policy "likes: leitura publica"
  on public.likes for select
  using (true);

drop policy if exists "likes: usuario logado curte" on public.likes;
create policy "likes: usuario logado curte"
  on public.likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "likes: usuario logado remove a propria curtida" on public.likes;
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

drop policy if exists "fan_submissions: aprovados sao publicos" on public.fan_submissions;
create policy "fan_submissions: aprovados sao publicos"
  on public.fan_submissions for select
  using (status = 'approved' or auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  ));

drop policy if exists "fan_submissions: usuario logado envia" on public.fan_submissions;
create policy "fan_submissions: usuario logado envia"
  on public.fan_submissions for insert
  with check (auth.uid() = user_id);

drop policy if exists "fan_submissions: admin modera" on public.fan_submissions;
create policy "fan_submissions: admin modera"
  on public.fan_submissions for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- STORAGE BUCKETS (o bucket "arquivos" que já existe não é tocado) ----------
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('audio', 'audio', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('fan-uploads', 'fan-uploads', true) on conflict (id) do nothing;

drop policy if exists "covers: leitura publica" on storage.objects;
create policy "covers: leitura publica"
  on storage.objects for select
  using (bucket_id = 'covers');

drop policy if exists "audio: leitura publica" on storage.objects;
create policy "audio: leitura publica"
  on storage.objects for select
  using (bucket_id = 'audio');

drop policy if exists "fan-uploads: leitura publica" on storage.objects;
create policy "fan-uploads: leitura publica"
  on storage.objects for select
  using (bucket_id = 'fan-uploads');

drop policy if exists "covers: admin faz upload" on storage.objects;
create policy "covers: admin faz upload"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "audio: admin faz upload" on storage.objects;
create policy "audio: admin faz upload"
  on storage.objects for insert
  with check (
    bucket_id = 'audio'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "fan-uploads: usuario logado faz upload" on storage.objects;
create policy "fan-uploads: usuario logado faz upload"
  on storage.objects for insert
  with check (
    bucket_id = 'fan-uploads'
    and auth.role() = 'authenticated'
  );

-- =========================================================
-- Depois de rodar, crie sua conta em /login e torne-a admin:
--   update public.profiles set is_admin = true where id =
--     (select id from auth.users where email = 'seu-email@exemplo.com');
-- =========================================================
