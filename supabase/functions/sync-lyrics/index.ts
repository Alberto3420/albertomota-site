import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { syncVersionLyrics } from '../_shared/lyricsSync.ts'

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

// Busca (ou busca de novo) a letra sincronizada de uma versão pronta do usuário.
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
      .select('id, external_id, clip_id, status, aligned_lyrics, music_projects!inner(user_id)')
      .eq('id', versionId)
      .single()
    if (error || !version) throw new Error('Versão não encontrada.')

    const owner = (version.music_projects as unknown as { user_id: string }).user_id
    if (owner !== user.id) throw new Error('Versão não encontrada.')
    if (version.status !== 'ready') throw new Error('A música ainda não está pronta.')
    if (version.aligned_lyrics) return json({ alignedLyrics: version.aligned_lyrics })

    const alignedLyrics = await syncVersionLyrics(adminClient, version)
    return json({ alignedLyrics })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro interno' }, 400)
  }
})
