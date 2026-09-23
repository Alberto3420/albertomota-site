const STEPS = [
  { number: '01', title: 'Enxergar', description: 'Observar a história antes de escrever a primeira palavra.' },
  { number: '02', title: 'Escrever', description: 'Transformar a vivência em linguagem, verso a verso.' },
  { number: '03', title: 'Compor', description: 'Encontrar a melodia e a harmonia que a letra pede.' },
  { number: '04', title: 'Cantar', description: 'Dar voz e verdade à canção na interpretação.' },
  { number: '05', title: 'Publicar', description: 'Gravar e lançar a composição para o mundo.' },
  { number: '06', title: 'Compartilhar', description: 'Levar a canção a quem ela pertence.' },
]

export default function Method() {
  return (
    <section id="metodo" className="border-t border-[#e6e1da] bg-white py-24">
      <div className="container-page">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Método</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-navy md:text-4xl">
          Da primeira ideia até encontrar o mundo
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="group relative rounded-2xl border border-[#e4ded5] bg-[#fbf8f3] p-6 transition duration-200 hover:-translate-y-1 hover:border-clay/50 hover:shadow-lg hover:shadow-clay/10"
            >
              <span className="font-serif text-4xl font-semibold text-clay/80 transition group-hover:text-clay">
                {step.number}
              </span>
              {index % 3 !== 2 && (
                <span
                  aria-hidden="true"
                  className="absolute left-full top-10 hidden h-px w-8 bg-clay/40 lg:block"
                />
              )}
              <h3 className="mt-3 text-xl font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#70747a]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
