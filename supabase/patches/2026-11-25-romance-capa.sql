-- Capa do romance: coluna cover_url + bucket público "romance-capas" (upload só pelo autor). Aditivo e idempotente.
alter table public.novels add column if not exists cover_url text not null default '';

insert into storage.buckets (id, name, public)
values ('romance-capas', 'romance-capas', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'romance-capas: somente o autor'
  ) then
    create policy "romance-capas: somente o autor" on storage.objects for all
      using (bucket_id = 'romance-capas' and lower(coalesce(auth.jwt() ->> 'email', '')) = 'omegasist1516@gmail.com')
      with check (bucket_id = 'romance-capas' and lower(coalesce(auth.jwt() ->> 'email', '')) = 'omegasist1516@gmail.com');
  end if;
end $$;
