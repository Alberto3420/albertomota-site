import { createClient } from '@supabase/supabase-js'

const PREVIEW_URL = 'http://127.0.0.1:54321'
const PREVIEW_KEY = 'preview-anon-key'

// Variáveis coladas em painéis (Cloudflare etc.) costumam vir com espaços, aspas ou sem "https://".
// Um valor inválido faz o createClient lançar erro e derruba o site inteiro (página em branco).
function cleanValue(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']+|["']+$/g, '').trim()
}

// Endereço público do projeto (o mesmo já usado nos links de áudio); não é segredo.
const PROJECT_URL = 'https://vszdpaithvzsuheaftek.supabase.co'

function resolveUrl(value: string | undefined): string | null {
  let url = cleanValue(value)
  if (!url) return null
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  try {
    const { origin, hostname } = new URL(url)
    // Um host sem ponto (ex.: uma chave colada no lugar da URL) nunca é um projeto Supabase.
    return hostname.includes('.') || hostname === 'localhost' ? origin : null
  } catch {
    return null
  }
}

const configuredUrl = resolveUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined)
const supabaseAnonKey = cleanValue(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || null

if (!configuredUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase não configurado ou com valor inválido: confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (.env.local ou variáveis da Cloudflare; veja .env.example).'
  )
}

// Com a chave presente mas a URL inválida, usa o endereço do projeto em vez de quebrar o login.
const supabaseUrl = configuredUrl ?? (supabaseAnonKey ? PROJECT_URL : null)

// Permite visualizar a interface antes de conectar um projeto Supabase.
export const supabase = createClient(supabaseUrl ?? PREVIEW_URL, supabaseAnonKey ?? PREVIEW_KEY)
