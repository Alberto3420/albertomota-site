import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { archiveVersionAudio } from '../_shared/archive.ts'

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

// Guarda no Supabase o áudio de uma versão já pronta (músicas anteriores ao arquivamento automático).
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

    const { versionId } = await request.json()
    if (!versionId) throw new Error('Versão não informada.')

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: version, error } = await adminClient
      .from('music_versions')
      .select('id, audio_url, status, music_projects!inner(user_id)')
      .eq('id', versionId)
      .single()
    if (error || !version) throw new Error('Versão não encontrada.')

    // A versão precisa ser do usuário que pede.
    const owner = (version.music_projects as unknown as { user_id: string }).user_id
    if (owner !== user.id) throw new Error('Versão não encontrada.')
    if (version.status !== 'ready' || !version.audio_url) throw new Error('A música ainda não está pronta.')

    const audioUrl = await archiveVersionAudio(adminClient, version, user.id)
    return json({ audioUrl })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro interno' }, 400)
  }
})
