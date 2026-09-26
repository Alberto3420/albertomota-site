import { useEffect, useRef, useState } from 'react'
import { claimPlayback } from '../lib/singlePlayer'

export default function AudioPlayer({ src, title }: { src: string | null; title?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    audio?.pause()
    if (audio) audio.currentTime = 0
    setPlaying(false)
    setProgress(0)
  }, [src])

  if (!src) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex min-w-[6rem] items-center justify-center gap-2 rounded-full border border-gold px-5 py-2 text-sm font-semibold text-gold"
      >
        <span aria-hidden="true">▶</span>
        Ouvir
      </button>
    )
  }

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      void audio.play()
    }
    setPlaying(!playing)
  }

  function onTimeUpdate() {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setProgress((audio.currentTime / audio.duration) * 100)
  }

  function stop() {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setPlaying(false)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {!playing && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label="Tocar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-body"
          >
            ▶
          </button>
          <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {playing && title && (
        <div className="flex items-center gap-3 bg-navy px-3 py-2 text-left text-white shadow-md">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold" aria-hidden="true">
            <span className="sound-bars">
              <i />
              <i />
              <i />
            </span>
          </span>
          <span>
            <span className="block text-[8px] font-bold uppercase tracking-[0.16em] text-gold-light">
              Tocando agora
            </span>
            <span className="block text-xs font-semibold">{title}</span>
          </span>
          <button
            type="button"
            onClick={stop}
            aria-label={`Parar ${title}`}
            className="ml-2 flex h-7 w-7 items-center justify-center rounded-full border border-gold text-[10px] text-gold transition hover:bg-gold hover:text-body"
          >
            ■
          </button>
        </div>
      )}
      <audio
        ref={audioRef}
        src={src}
        autoPlay={false}
        preload="none"
        onPlay={(event) => {
          claimPlayback(event.currentTarget)
          setPlaying(true)
        }}
        onTimeUpdate={onTimeUpdate}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  )
}
