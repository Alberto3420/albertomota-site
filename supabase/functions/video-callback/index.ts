// A Suno exige um callBackUrl no pedido de vídeo. Neste teste o resultado é lido por consulta
// (create-video, action "status"), então o callback só confirma o recebimento.
Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  console.log('Callback de vídeo da Suno recebido')
  return Response.json({ status: 'received' })
})
