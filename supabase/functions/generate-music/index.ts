import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUNO_API_URL = 'https://api.sunoapi.org/api/v1/generate'
const GENERATION_PRICE_CENTS = 1990

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sunoApiKey = Deno.env.get('SUNO_API_KEY')
    const authorization = request.headers.get('Authorization')

    if (!sunoApiKey || !authorization) {
      throw new Error('Integração Suno não configurada ou usuário não autenticado.')
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) throw new Error('Usuário não autenticado.')

    const { title, melody, lyrics } = await request.json()
    if (!title || !melody || !lyrics) throw new Error('Título, melodia e letra são obrigatórios.')

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: project, error: projectError } = await adminClient
      .from('music_projects')
      .insert({ user_id: user.id, title, melody, lyrics, status: 'generating' })
      .select()
      .single()
    if (projectError) throw projectError

    const { error: versionsError } = await adminClient
      .from('music_versions')
      .insert([
        { project_id: project.id, version_number: 1, melody, lyrics, status: 'generating' },
        { project_id: project.id, version_number: 2, melody, lyrics, status: 'generating' },
      ])
    if (versionsError) throw versionsError

    const { error: paymentError } = await adminClient.from('music_payments').insert({
      project_id: project.id,
      user_id: user.id,
      amount_cents: GENERATION_PRICE_CENTS,
      status: 'pending',
    })
    if (paymentError) throw paymentError

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
        title,
        style: melody,
        lyrics,
        callBackUrl: `${supabaseUrl}/functions/v1/suno-callback`,
      }),
    })
    const sunoResult = await sunoResponse.json()
    if (!sunoResponse.ok || sunoResult.code !== 200 || !sunoResult.data?.taskId) {
      await adminClient.from('music_projects').update({ status: 'failed' }).eq('id', project.id)
      await adminClient.from('music_versions').update({ status: 'failed', error_message: sunoResult.msg ?? 'Falha na Suno' }).eq('project_id', project.id)
      throw new Error(sunoResult.msg ?? 'A Suno recusou a geração.')
    }

    await adminClient.from('music_versions').update({ external_id: sunoResult.data.taskId }).eq('project_id', project.id)

    return new Response(JSON.stringify({ projectId: project.id, taskId: sunoResult.data.taskId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Erro interno'

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})