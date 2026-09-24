-- Guarda a duração (em segundos) devolvida pela Suno no callback. Aditivo e idempotente.
alter table public.music_versions add column if not exists duration numeric;
