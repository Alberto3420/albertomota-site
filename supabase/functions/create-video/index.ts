import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUNO_API = 'https://api.sunoapi.org/api/v1/mp4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// TESTE (somente admin): pede à Suno o vídeo de uma versão pronta e consulta o andamento.
// action "start" envia o pedido (gasta créditos); action "status" consulta sem custo.
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('Usuário não autenticado.')

    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) throw new Error('Usuário não autenticado.')

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    // Administrador = e-mail da lista FREE_EMAILS (profiles pode não ter a coluna is_admin).
    const allowedEmails = (Deno.env.get('FREE_EMAILS') ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
    if (!user.email || !allowedEmails.includes(user.email.toLowerCase())) {
      throw new Error('Recurso em teste, disponível só para o administrador.')
    }

    const { versionId, action } = await request.json()
    if (!versionId) throw new Error('Versão não informada.')

    const { data: version, error } = await adminClient
      .from('music_versions')
      .select('id, external_id, clip_id, status, video_task_id, video_url, music_projects!inner(user_id)')
      .eq('id', versionId)
      .single()
    if (error || !version) throw new Error('Versão não encontrada.')
    if ((version.music_projects as unknown as { user_id: string }).user_id !== user.id) {
      throw new Error('Versão não encontrada.')
    }
    if (version.status !== 'ready' || !version.external_id || !version.clip_id) {
      throw new Error('A música ainda não está pronta.')
    }

    const sunoApiKey = Deno.env.get('SUNO_API_KEY')
    if (!sunoApiKey) throw new Error('Integração Suno não configurada.')
    const headers = { Authorization: `Bearer ${sunoApiKey}`, 'Content-Type': 'application/json' }

    if (action === 'start') {
      // Já tem pedido de vídeo desta versão: não cobra de novo, só segue consultando.
      if (version.video_url || version.video_task_id) return json({ started: true, alreadyExists: true })

      const response = await fetch(`${SUNO_API}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          taskId: version.external_id,
          audioId: version.clip_id,
          callBackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/video-callback`,
          author: 'Alberto Mota',
          domainName: 'albertomota.com.br',
        }),
      })
      const result = await response.json()
      // 409: o vídeo desta faixa já existe; segue para consultar o existente.
      if (result.code !== 200 && result.code !== 409) {
        throw new Error(result.msg ?? `A Suno recusou o pedido de vídeo (${response.status}).`)
      }
      const videoTaskId = result.data?.taskId
      if (!videoTaskId) {
        throw new Error(
          result.code === 409
            ? 'A Suno diz que o vídeo desta faixa já existe, mas não informou o identificador dele.'
            : 'A Suno não devolveu o identificador do vídeo.',
        )
      }
      const { error: saveError } = await adminClient
        .from('music_versions')
        .update({ video_task_id: videoTaskId })
        .eq('id', version.id)
      if (saveError) throw saveError
      return json({ started: true, alreadyExists: result.code === 409 })
    }

    if (version.video_url) return json({ status: 'SUCCESS', videoUrl: version.video_url })
    if (!version.video_task_id) throw new Error('Nenhum vídeo foi pedido para esta versão.')

    // A consulta usa o id devolvido pelo pedido de vídeo, não o id da música.
    const response = await fetch(`${SUNO_API}/record-info?taskId=${encodeURIComponent(version.video_task_id)}`, { headers })
    const result = await response.json()
    if (result.code !== 200) throw new Error(result.msg ?? 'Não foi possível consultar o vídeo.')
    const videoUrl = result.data?.response?.videoUrl ?? null
    if (videoUrl) await adminClient.from('music_versions').update({ video_url: videoUrl }).eq('id', version.id)
    return json({ status: result.data?.successFlag ?? 'PENDING', videoUrl })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro interno' }, 400)
  }
})
