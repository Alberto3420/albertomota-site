const PHASES = [
  { title: 'Vivência', text: 'O ponto de partida' },
  { title: 'Palavra', text: 'A emoção ganha forma' },
  { title: 'Canção', text: 'A história encontra alguém' },
]

export default function FeaturedStory() {
  return (
    <section className="border-t border-white/10 bg-navy py-20 text-white md:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(20rem,1fr)_minmax(0,1.35fr)] lg:gap-16">
        <div className="relative aspect-square overflow-hidden border border-gold/70">
          <img
            src="/andarilho-capa.png"
            alt="Andarilho caminhando à beira-mar"
            className="h-full w-full object-cover"
          />
          <span className="absolute right-6 top-6 bg-gold px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-body">
            Histórias que viraram música
          </span>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-light">
            Por trás de cada composição
          </span>
          <h2 className="mt-4 text-5xl font-semibold leading-none text-white md:text-7xl">
            Andarilho
          </h2>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/85 md:text-lg">
            Um homem procurando se encontrar, buscando respostas no mundo e dentro de si. Essa
            história se tornou “Andarilho” — uma composição sobre estrada, liberdade, propósito e
            o caminho de volta às próprias raízes.
          </p>

          <div className="mt-8 grid gap-6 border-y border-white/20 py-6 sm:grid-cols-3 sm:gap-4">
            {PHASES.map((phase) => (
              <div key={phase.title}>
                <h3 className="text-lg font-semibold text-gold-light">{phase.title}</h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/75">
                  {phase.text}
                </p>
              </div>
            ))}
          </div>

          <a
            href="#composicoes"
            className="mt-8 inline-flex items-center justify-center rounded-sm bg-gold px-6 py-3 text-sm font-bold text-body transition hover:bg-gold-light"
          >
            Conhecer as composições
          </a>
        </div>
      </div>
    </section>
  )
}
