import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUNO_CREDIT_URL = 'https://api.sunoapi.org/api/v1/generate/credit'

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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const sunoApiKey = Deno.env.get('SUNO_API_KEY')
    const authorization = request.headers.get('Authorization')
    if (!sunoApiKey || !authorization) {
      throw new Error('Integração Suno não configurada ou usuário não autenticado.')
    }

    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) throw new Error('Usuário não autenticado.')

    const sunoResponse = await fetch(SUNO_CREDIT_URL, {
      headers: { Authorization: `Bearer ${sunoApiKey}` },
    })
    const sunoResult = await sunoResponse.json()
    if (!sunoResponse.ok || sunoResult.code !== 200 || typeof sunoResult.data !== 'number') {
      throw new Error(sunoResult.msg ?? 'Não foi possível consultar os créditos da Suno.')
    }

    return json({ credits: sunoResult.data })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro interno' }, 400)
  }
})
