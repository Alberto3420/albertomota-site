import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BUCKET = 'musicas-geradas'
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`

export function isArchived(audioUrl: string | null) {
  return !!audioUrl && audioUrl.includes(PUBLIC_MARKER)
}

// Copia o áudio (link temporário da Suno) para o Storage do Supabase e aponta a versão para a cópia.
// Devolve a URL definitiva. Lança erro se o download ou o upload falhar (a URL antiga continua valendo).
export async function archiveVersionAudio(
  adminClient: SupabaseClient,
  version: { id: string; audio_url: string | null },
  userId: string,
) {
  if (!version.audio_url) throw new Error('Versão sem áudio.')
  if (isArchived(version.audio_url)) return version.audio_url

  const download = await fetch(version.audio_url)
  if (!download.ok) throw new Error(`Não foi possível baixar o áudio (${download.status}).`)
  const contentType = download.headers.get('content-type')?.split(';')[0] || 'audio/mpeg'
  const bytes = new Uint8Array(await download.arrayBuffer())

  const path = `${userId}/${version.id}.mp3`
  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true })
  if (uploadError) throw uploadError

  const publicUrl = adminClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { error: updateError } = await adminClient
    .from('music_versions')
    .update({ audio_url: publicUrl })
    .eq('id', version.id)
  if (updateError) throw updateError
  return publicUrl
}
