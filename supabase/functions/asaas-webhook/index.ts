import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startSunoGeneration } from '../_shared/suno.ts'

// Eventos do Asaas -> status em music_payments.
const PAID_EVENTS = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']
const OTHER_EVENTS: Record<string, 'overdue' | 'cancelled' | 'refunded'> = {
  PAYMENT_OVERDUE: 'overdue',
  PAYMENT_DELETED: 'cancelled',
  PAYMENT_REFUNDED: 'refunded',
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return diff === 0
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
  const receivedToken = request.headers.get('asaas-access-token') ?? ''
  if (!expectedToken || !safeEqual(receivedToken, expectedToken)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { event, payment } = await request.json()
    const paymentId: string | undefined = payment?.id
    if (!event || !paymentId) return Response.json({ status: 'ignored' })

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (PAID_EVENTS.includes(event)) {
      // Só o primeiro evento de pagamento vence a corrida: evita gerar (e gastar créditos) duas vezes.
      const { data: claimed, error } = await adminClient
        .from('music_payments')
        .update({ status: 'confirmed', paid_at: new Date().toISOString() })
        .eq('external_id', paymentId)
        .eq('status', 'pending')
        .select('project_id')
      if (error) throw error
      if (!claimed?.length) return Response.json({ status: 'already-processed' })

      const { data: project, error: projectError } = await adminClient
        .from('music_projects')
        .select('id, title, melody, lyrics')
        .eq('id', claimed[0].project_id)
        .single()
      if (projectError) throw projectError

      try {
        await startSunoGeneration(adminClient, project)
      } catch (sunoError) {
        // Pagamento recebido, mas a Suno recusou: precisa de atenção manual (ex.: reembolso).
        console.error('Pagamento confirmado, mas a geração falhou:', paymentId, sunoError)
      }
      return Response.json({ status: 'generation-started' })
    }

    const newStatus = OTHER_EVENTS[event]
    if (newStatus) {
      const { data: updated, error } = await adminClient
        .from('music_payments')
        .update({ status: newStatus })
        .eq('external_id', paymentId)
        .eq('status', 'pending')
        .select('project_id')
      if (error) throw error
      // Cobrança vencida/cancelada antes do pagamento: o pedido não será gerado.
      for (const row of updated ?? []) {
        await adminClient.from('music_projects').update({ status: 'failed' }).eq('id', row.project_id)
        await adminClient
          .from('music_versions')
          .update({ status: 'failed', error_message: 'Pagamento não confirmado.' })
          .eq('project_id', row.project_id)
      }
    }

    return Response.json({ status: 'received' })
  } catch (error) {
    console.error('Erro no webhook do Asaas:', error)
    // 500 faz o Asaas tentar de novo.
    return Response.json({ status: 'error' }, { status: 500 })
  }
})
