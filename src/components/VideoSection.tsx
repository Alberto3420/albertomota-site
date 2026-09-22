import { useRef, useState } from 'react'

const ESTACAO_AUDIO_URL =
  'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/estacao.mp3'

export default function VideoSection() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  function toggleAudio() {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  function stopAudio() {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setPlaying(false)
  }

  return (
    <section className="border-t border-[#e6e1da] bg-[#f7f7f5] py-20 md:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(34rem,1.18fr)] lg:gap-16">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Videoclipe oficial
          </span>
          <h2 className="mt-4 text-5xl font-medium leading-none text-navy md:text-7xl">
            Na estação
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#536477] md:text-lg">
            Uma história sobre partidas, lembranças e os caminhos que mudam para sempre. Assista à
            versão completa e mergulhe no universo desta composição.
          </p>

          <div className="mt-8 flex items-center gap-3 border-l-4 border-gold bg-navy px-5 py-3 text-white shadow-lg">
            <strong className="text-3xl font-bold text-gold-light md:text-4xl">+1.000.000</strong>
            <span className="text-[10px] font-bold uppercase leading-4 tracking-wide">
              de visualizações no TikTok
            </span>
          </div>

          <p className="mt-5 max-w-xl font-[Georgia] text-base font-bold italic leading-7 text-[#536477] md:text-lg">
            Se esta canção alcançou o coração das pessoas, já existe uma grande recompensa.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href="https://www.tiktok.com/@alberto_mota820"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 rounded-sm bg-gold px-6 py-3 text-sm font-bold text-body transition hover:bg-gold-light"
            >
              <span aria-hidden="true">▶</span>
              Assistir ao videoclipe
            </a>
            <a
              href="#comentarios"
              className="border-b border-gold pb-1 text-sm font-bold text-body transition hover:text-gold"
            >
              Veja abaixo alguns dos comentários ↓
            </a>
          </div>
        </div>

        <div className="group relative aspect-video overflow-hidden rounded-md border border-gold/80 bg-navy shadow-2xl">
          <img
            src="/na-estacao.png"
            alt="Videoclipe Na estação"
            className="h-full w-full object-cover brightness-[0.55] transition duration-500 group-hover:scale-105 group-hover:brightness-75"
          />
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3">
            <button
              type="button"
              onClick={toggleAudio}
              aria-label={playing ? 'Pausar Na estação' : 'Tocar Na estação'}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gold text-2xl text-body shadow-lg transition hover:scale-110"
            >
              {playing ? 'Ⅱ' : '▶'}
            </button>
            <button
              type="button"
              onClick={stopAudio}
              disabled={!playing}
              aria-label="Parar Na estação"
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold bg-navy/80 text-lg text-gold transition hover:bg-gold hover:text-body disabled:cursor-not-allowed disabled:opacity-50"
            >
              ■
            </button>
          </div>
          <div className="absolute bottom-7 left-7 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-light">
              Alberto Mota
            </span>
            <p className="mt-1 font-[Georgia] text-3xl font-bold">Na estação</p>
          </div>
          <audio ref={audioRef} src={ESTACAO_AUDIO_URL} onEnded={() => setPlaying(false)} />
        </div>
      </div>
    </section>
  )
}
