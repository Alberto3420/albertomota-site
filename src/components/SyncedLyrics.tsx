import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { MusicVersion, SyncedLyrics as SyncedLyricsData } from '../types/models'

// Player com letra sincronizada (karaokê): destaca a palavra atual e rola até a linha.
export default function SyncedLyrics({ version }: { version: MusicVersion }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const [lyrics, setLyrics] = useState<SyncedLyricsData | null>(version.aligned_lyrics ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<{ line: number; word: number } | null>(null)

  useEffect(() => {
    if (version.aligned_lyrics) setLyrics(version.aligned_lyrics)
  }, [version.aligned_lyrics])

  // Posição de cada palavra na ordem de tempo, para achar a atual com busca binária.
  const flat = useMemo(
    () => (lyrics?.lines ?? []).flatMap((line, lineIndex) => line.map((word, wordIndex) => ({ ...word, lineIndex, wordIndex }))),
    [lyrics],
  )

  function locate(time: number) {
    let low = 0
    let high = flat.length - 1
    let found = -1
    while (low <= high) {
      const mid = (low + high) >> 1
      if (flat[mid].s <= time) {
        found = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    return found
  }

  // Acompanha o áudio quadro a quadro enquanto toca; no pause/seek atualiza uma vez.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || flat.length === 0) return
    let frame = 0

    function update() {
      const index = locate(audio!.currentTime)
      const item = index >= 0 ? flat[index] : null
      setActive((previous) =>
        item
          ? previous?.line === item.lineIndex && previous.word === item.wordIndex
            ? previous
            : { line: item.lineIndex, word: item.wordIndex }
          : previous === null
            ? previous
            : null,
      )
    }
    function loop() {
      update()
      frame = requestAnimationFrame(loop)
    }
    function start() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(loop)
    }
    function stop() {
      cancelAnimationFrame(frame)
      update()
    }

    audio.addEventListener('play', start)
    audio.addEventListener('pause', stop)
    audio.addEventListener('ended', stop)
    audio.addEventListener('seeked', update)
    if (!audio.paused) start()
    return () => {
      cancelAnimationFrame(frame)
      audio.removeEventListener('play', start)
      audio.removeEventListener('pause', stop)
      audio.removeEventListener('ended', stop)
      audio.removeEventListener('seeked', update)
    }
  }, [flat])

  // Rola suavemente só dentro do painel da letra, sem mexer na página.
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    const line = lineRefs.current[active.line]
    if (!container || !line) return
    const target = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [active?.line])

  function seekTo(seconds: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = seconds
    if (audio.paused) void audio.play()
  }

  async function loadLyrics(force = false) {
    setLoading(true)
    setError(null)
    const { data, error: invokeError } = await supabase.functions.invoke('sync-lyrics', {
      body: { versionId: version.id, force },
    })
    setLoading(false)
    if (invokeError || data?.error) {
      setError('Não foi possível buscar a letra sincronizada agora. Tente de novo em instantes.')
      return
    }
    if (!data?.alignedLyrics) {
      setError('Esta faixa não tem letra sincronizada disponível.')
      return
    }
    setLyrics(data.alignedLyrics)
  }

  return (
    <div>
      <audio ref={audioRef} controls className="mt-3 w-full" src={version.audio_url ?? undefined} />

      {lyrics ? (
        <div
          ref={containerRef}
          className="relative mt-3 max-h-96 overflow-y-auto rounded-lg border border-[#24457a] bg-[#0f2547] px-6 py-5 text-center"
          aria-label="Letra sincronizada"
        >
          {lyrics.lines.map((line, lineIndex) => (
            <p
              key={lineIndex}
              ref={(element) => {
                lineRefs.current[lineIndex] = element
              }}
              className={`py-1 text-lg leading-snug transition-opacity ${
                active?.line === lineIndex ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {line.map((word, wordIndex) => {
                const isCurrent = active?.line === lineIndex && active.word === wordIndex
                const wasSung = !!active && (lineIndex < active.line || (lineIndex === active.line && wordIndex < active.word))
                return (
                  <span
                    key={wordIndex}
                    onClick={() => seekTo(word.s)}
                    className={`cursor-pointer transition-colors ${
                      isCurrent ? 'font-bold text-gold-light' : wasSung ? 'text-paper' : 'text-paper/60'
                    }`}
                  >
                    {word.w}{' '}
                  </span>
                )
              })}
            </p>
          ))}
          <button
            type="button"
            onClick={() => void loadLyrics(true)}
            disabled={loading}
            className="mt-2 text-xs text-paper/50 hover:underline disabled:opacity-60"
          >
            {loading ? 'Atualizando…' : 'Atualizar letra sincronizada'}
          </button>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void loadLyrics()}
            disabled={loading}
            className="text-sm font-semibold text-gold-light hover:underline disabled:opacity-60"
          >
            {loading ? 'Buscando letra…' : 'Mostrar letra sincronizada'}
          </button>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  )
}
