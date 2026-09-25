-- Bucket para guardar o áudio gerado pela Suno (os links da Suno expiram). Aditivo e idempotente.
-- Caminho dos arquivos: <user_id>/<version_id>.mp3. O bucket é público para leitura (URL não adivinhável);
-- só o service role grava, e o dono pode apagar os próprios arquivos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('musicas-geradas', 'musicas-geradas', true, 52428800, array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'])
on conflict (id) do nothing;

drop policy if exists "musicas-geradas: dono remove os proprios arquivos" on storage.objects;
create policy "musicas-geradas: dono remove os proprios arquivos"
  on storage.objects for delete
  using (
    bucket_id = 'musicas-geradas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
