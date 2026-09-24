import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { startSunoGeneration } from '../_shared/suno.ts'

const GENERATION_PRICE_CENTS = 1990

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

// ASAAS_ENV=production usa a API real; qualquer outro valor usa o sandbox.
function asaasBaseUrl() {
  return Deno.env.get('ASAAS_ENV') === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://api-sandbox.asaas.com/v3'
}

async function asaas(path: string, init: RequestInit = {}) {
  const response = await fetch(`${asaasBaseUrl()}${path}`, {
    ...init,
    headers: {
      access_token: Deno.env.get('ASAAS_API_KEY')!,
      'Content-Type': 'application/json',
      'User-Agent': 'albertomota-site',
      ...(init.headers ?? {}),
    },
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(result?.errors?.[0]?.description ?? 'O Asaas recusou a solicitação.')
  }
  return result
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let createdProjectId: string | null = null
  const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('Usuário não autenticado.')

    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) throw new Error('Usuário não autenticado.')

    const { title, melody, lyrics, cpf } = await request.json()
    if (!title || !melody || !lyrics) throw new Error('Título, melodia e letra são obrigatórios.')

    // Isenção de pagamento para os e-mails listados em FREE_EMAILS (separados por vírgula).
    const freeEmails = (Deno.env.get('FREE_EMAILS') ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
    const isFree = !!user.email && freeEmails.includes(user.email.toLowerCase())

    let cpfCnpj = ''
    if (!isFree) {
      cpfCnpj = String(cpf ?? '').replace(/\D/g, '')
      if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) throw new Error('Informe um CPF ou CNPJ válido.')
      if (!Deno.env.get('ASAAS_API_KEY')) throw new Error('Pagamento não configurado.')
    }

    const { data: project, error: projectError } = await adminClient
      .from('music_projects')
      .insert({ user_id: user.id, title, melody, lyrics, status: isFree ? 'generating' : 'payment_pending' })
      .select()
      .single()
    if (projectError) throw projectError
    createdProjectId = project.id

    const { error: versionsError } = await adminClient.from('music_versions').insert(
      [1, 2].map((versionNumber) => ({
        project_id: project.id,
        version_number: versionNumber,
        melody,
        lyrics,
        status: isFree ? 'generating' : 'queued',
      })),
    )
    if (versionsError) throw versionsError

    if (isFree) {
      const taskId = await startSunoGeneration(adminClient, project)
      return json({ projectId: project.id, taskId })
    }

    // Cliente no Asaas (reaproveita o já criado para este usuário).
    const existing = await asaas(`/customers?externalReference=${user.id}&limit=1`)
    let customerId: string | undefined = existing.data?.[0]?.id
    if (!customerId) {
      const customer = await asaas('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: user.user_metadata?.display_name || user.email,
          email: user.email,
          cpfCnpj,
          externalReference: user.id,
        }),
      })
      customerId = customer.id
    }

    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const payment = await asaas('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED',
        value: GENERATION_PRICE_CENTS / 100,
        dueDate,
        description: `Música personalizada: ${title}`,
        externalReference: project.id,
      }),
    })

    const { error: paymentError } = await adminClient.from('music_payments').insert({
      project_id: project.id,
      user_id: user.id,
      provider: 'asaas',
      external_id: payment.id,
      amount_cents: GENERATION_PRICE_CENTS,
      status: 'pending',
      checkout_url: payment.invoiceUrl,
    })
    if (paymentError) throw paymentError

    return json({ projectId: project.id, paymentUrl: payment.invoiceUrl })
  } catch (error) {
    // Pedido que não chegou a virar cobrança não deve ficar na lista do usuário.
    if (createdProjectId) {
      const { data: charge } = await adminClient
        .from('music_payments')
        .select('id')
        .eq('project_id', createdProjectId)
        .maybeSingle()
      const { data: versions } = await adminClient
        .from('music_versions')
        .select('external_id')
        .eq('project_id', createdProjectId)
      const startedOnSuno = versions?.some((version) => version.external_id)
      if (!charge && !startedOnSuno) {
        await adminClient.from('music_projects').delete().eq('id', createdProjectId)
      }
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Erro interno'
    return json({ error: errorMessage }, 400)
  }
})
