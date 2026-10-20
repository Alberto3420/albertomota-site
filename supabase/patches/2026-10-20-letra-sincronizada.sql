-- Letra sincronizada (palavra a palavra) devolvida pela Suno. Aditivo e idempotente.
-- Formato: { "lines": [[{ "w": "palavra", "s": 1.2, "e": 1.6 }, ...], ...] }
alter table public.music_versions add column if not exists aligned_lyrics jsonb;
