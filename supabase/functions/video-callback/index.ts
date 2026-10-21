import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Callback do vídeo da Suno: { code, msg, data: { task_id, video_url } }.
// Guarda o link na versão que fez o pedido (video_task_id).
Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    const payload = await request.json()
    console.log('Callback de vídeo da Suno:', JSON.stringify(payload))
    const taskId = payload.data?.task_id
    const videoUrl = payload.data?.video_url
    if (payload.code !== 200 || !taskId || !videoUrl) return Response.json({ status: 'ignored' })

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { error } = await adminClient.from('music_versions').update({ video_url: videoUrl }).eq('video_task_id', taskId)
    if (error) throw error
    return Response.json({ status: 'received' })
  } catch (error) {
    console.error('Erro ao salvar callback de vídeo:', error)
    return Response.json({ status: 'error' }, { status: 400 })
  }
})
