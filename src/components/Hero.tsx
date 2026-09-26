export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate overflow-hidden bg-ink text-paper"
      style={{
        backgroundImage: "url('/hero-escrevendo.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/70 to-ink/20" />
      <div className="container-page flex min-h-[36rem] items-center py-20 md:min-h-[42rem] md:py-28">
        <div className="flex max-w-2xl flex-col gap-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sand">
            Composição musical
          </span>
          <h1 className="text-4xl font-semibold leading-[1.1] md:text-6xl lg:text-7xl">
            Histórias que se transformam em canções
          </h1>
          <p className="max-w-xl text-lg text-paper/80">
            Composições autorais sobre afeto, raízes e esperança — canções nascidas de histórias
            reais, escritas para durar.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#composicoes" className="btn-primary">
              Ouvir composições
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
