import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    const payload = await request.json()
    const callbackData = payload.data
    const taskId = callbackData?.task_id
    if (!taskId) return Response.json({ status: 'ignored' })

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const isError = payload.code !== 200 || callbackData.callbackType === 'error'

    if (isError) {
      const { error: versionError } = await adminClient
        .from('music_versions')
        .update({ status: 'failed', error_message: payload.msg ?? 'Falha na geração' })
        .eq('external_id', taskId)
      if (versionError) throw versionError
    } else {
      const status = callbackData.callbackType === 'complete' ? 'ready' : 'generating'
      const clips = callbackData.data ?? []
      for (let index = 0; index < clips.length; index += 1) {
        const clip = clips[index]
        const { error: versionError } = await adminClient
          .from('music_versions')
          .update({ status, audio_url: clip?.audio_url ?? null, clip_id: clip?.id ?? null })
          .eq('external_id', taskId)
          .eq('version_number', index + 1)
        if (versionError) throw versionError
      }
    }

    const { data: versions, error: fetchError } = await adminClient
      .from('music_versions')
      .select('project_id, status')
      .eq('external_id', taskId)
    if (fetchError) throw fetchError

    const projectId = versions?.[0]?.project_id
    if (projectId) {
      const projectStatus = versions.every((v) => v.status === 'ready')
        ? 'ready'
        : versions.some((v) => v.status === 'failed')
          ? 'failed'
          : 'generating'
      const { error: projectError } = await adminClient
        .from('music_projects')
        .update({ status: projectStatus, updated_at: new Date().toISOString() })
        .eq('id', projectId)

      if (projectError) throw projectError
    }

    return Response.json({ status: 'received' })
  } catch (error) {
    console.error('Erro ao salvar callback da Suno:', error)
    return Response.json({ status: 'error' }, { status: 400 })
  }
})
