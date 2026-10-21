import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// TESTE (só admin): gera o vídeo da Suno para esta versão e mostra o link quando ficar pronto.
export default function VideoTest({ versionId }: { versionId: string }) {
  const [phase, setPhase] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number>()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function call(action: 'start' | 'status') {
    const { data, error } = await supabase.functions.invoke('create-video', { body: { versionId, action } })
    if (error || data?.error) throw new Error(data?.error ?? 'Falha ao falar com o servidor.')
    return data
  }

  function poll(attempt: number) {
    timer.current = window.setTimeout(async () => {
      try {
        const data = await call('status')
        if (data.status === 'SUCCESS' && data.videoUrl) {
          setVideoUrl(data.videoUrl)
          setPhase('done')
        } else if (data.status !== 'PENDING') {
          throw new Error(`A Suno não conseguiu gerar o vídeo (${data.status}).`)
        } else if (attempt >= 60) {
          throw new Error('Demorou demais. Clique de novo mais tarde (não cobra de novo).')
        } else {
          poll(attempt + 1)
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Erro ao consultar o vídeo.')
        setPhase('error')
      }
    }, 10000)
  }

  async function start() {
    if (!window.confirm('Gerar o vídeo desta versão? Isso gasta créditos da Suno.')) return
    setPhase('working')
    setMessage(null)
    try {
      await call('start')
      poll(0)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erro ao pedir o vídeo.')
      setPhase('error')
    }
  }

  return (
    <div className="mt-3 text-sm">
      {phase === 'done' && videoUrl ? (
        <a href={videoUrl} target="_blank" rel="noreferrer" className="font-semibold text-gold-light hover:underline">
          Abrir vídeo (teste)
        </a>
      ) : (
        <button
          type="button"
          onClick={() => void start()}
          disabled={phase === 'working'}
          className="font-semibold text-gold-light hover:underline disabled:opacity-60"
        >
          {phase === 'working' ? 'Gerando vídeo… (pode levar alguns minutos)' : 'Criar vídeo (teste)'}
        </button>
      )}
      {message && <p className="mt-1 text-xs text-red-400">{message}</p>}
    </div>
  )
}
