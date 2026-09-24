import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUNO_API_URL = 'https://api.sunoapi.org/api/v1/generate'

interface ProjectToGenerate {
  id: string
  title: string
  melody: string
  lyrics: string
}

// Envia o pedido à Suno e grava o task id nas versões. Em caso de falha marca projeto e
// versões como "failed" e lança o erro. O resultado chega depois em suno-callback.
export async function startSunoGeneration(adminClient: SupabaseClient, project: ProjectToGenerate) {
  const sunoApiKey = Deno.env.get('SUNO_API_KEY')
  if (!sunoApiKey) throw new Error('Integração Suno não configurada.')

  await adminClient.from('music_projects').update({ status: 'generating' }).eq('id', project.id)
  await adminClient.from('music_versions').update({ status: 'generating' }).eq('project_id', project.id)

  const sunoResponse = await fetch(SUNO_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sunoApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      model: 'V6',
      title: project.title,
      style: project.melody,
      lyrics: project.lyrics,
      callBackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/suno-callback`,
    }),
  })
  const sunoResult = await sunoResponse.json()
  if (!sunoResponse.ok || sunoResult.code !== 200 || !sunoResult.data?.taskId) {
    await adminClient.from('music_projects').update({ status: 'failed' }).eq('id', project.id)
    await adminClient
      .from('music_versions')
      .update({ status: 'failed', error_message: sunoResult.msg ?? 'Falha na Suno' })
      .eq('project_id', project.id)
    throw new Error(sunoResult.msg ?? 'A Suno recusou a geração.')
  }

  await adminClient
    .from('music_versions')
    .update({ external_id: sunoResult.data.taskId })
    .eq('project_id', project.id)
  return sunoResult.data.taskId as string
}
