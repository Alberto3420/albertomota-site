-- Guarda o pedido de vídeo da Suno (id da tarefa de vídeo e o link do MP4). Aditivo e idempotente.
alter table public.music_versions add column if not exists video_task_id text;
alter table public.music_versions add column if not exists video_url text;
