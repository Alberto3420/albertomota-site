import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TIMESTAMPED_LYRICS_URL = 'https://api.sunoapi.org/api/v1/generate/get-timestamped-lyrics'

export interface SyncedWord {
  w: string
  s: number
  e: number
}

export interface SyncedLyrics {
  lines: SyncedWord[][]
}

interface AlignedWord {
  word: string
  success?: boolean
  startS: number
  endS: number
}

// Transforma o alignedWords da Suno em linhas de palavras: remove marcações como "[Verse]",
// usa as quebras de linha embutidas nas palavras e interpola o tempo das palavras sem sucesso.
export function buildSyncedLyrics(alignedWords: AlignedWord[]): SyncedLyrics {
  const lines: SyncedWord[][] = [[]]
  const newLine = () => {
    if (lines[lines.length - 1].length > 0) lines.push([])
  }

  alignedWords.forEach((item, index) => {
    const cleaned = String(item.word ?? '').replace(/\[[^\]]*\]/g, '')
    const parts = cleaned.split('\n')
    parts.forEach((part, partIndex) => {
      if (partIndex > 0) newLine()
      const text = part.trim()
      if (!text) return

      let start = item.startS
      let end = item.endS
      if (item.success === false || typeof start !== 'number' || typeof end !== 'number') {
        const previous = alignedWords.slice(0, index).reverse().find((w) => w.success !== false)
        const next = alignedWords.slice(index + 1).find((w) => w.success !== false)
        start = previous?.endS ?? next?.startS ?? 0
        end = next?.startS ?? start
      }
      lines[lines.length - 1].push({ w: text, s: start, e: end })
    })
  })

  return { lines: lines.filter((line) => line.length > 0) }
}

// Busca a letra sincronizada de uma versão pronta e grava em music_versions.aligned_lyrics.
// Devolve null para faixas sem letra (instrumentais) ou enquanto a Suno ainda não tem o alinhamento.
export async function syncVersionLyrics(
  adminClient: SupabaseClient,
  version: { id: string; external_id: string | null; clip_id: string | null },
): Promise<SyncedLyrics | null> {
  const sunoApiKey = Deno.env.get('SUNO_API_KEY')
  if (!sunoApiKey) throw new Error('Integração Suno não configurada.')
  if (!version.external_id || !version.clip_id) throw new Error('Versão sem identificadores da Suno.')

  const response = await fetch(TIMESTAMPED_LYRICS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sunoApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId: version.external_id, audioId: version.clip_id }),
  })
  const result = await response.json()
  if (!response.ok || result.code !== 200) {
    throw new Error(result.msg ?? `Falha ao buscar a letra sincronizada (${response.status}).`)
  }

  const alignedWords = result.data?.alignedWords
  if (!Array.isArray(alignedWords) || alignedWords.length === 0) return null

  const synced = buildSyncedLyrics(alignedWords)
  if (synced.lines.length === 0) return null

  const { error } = await adminClient.from('music_versions').update({ aligned_lyrics: synced }).eq('id', version.id)
  if (error) throw error
  return synced
}
