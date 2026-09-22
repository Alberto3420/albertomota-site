export default function About() {
  return (
    <section id="sobre" className="border-t border-[#e6e1da] bg-[#f7f7f5] py-20 md:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
        <div className="mx-auto aspect-square w-full max-w-[24rem] overflow-hidden rounded-full border-[6px] border-white shadow-2xl">
          <img
            src="/alberto-mota.png"
            alt="Alberto Mota"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Sobre o artista
          </span>
          <h2 className="mt-4 max-w-4xl text-4xl font-medium leading-tight text-navy md:text-6xl">
            Uma vida inteira transformada em canções.
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-7 text-[#536477] md:text-lg">
            Pernambucano de origem e morando atualmente no Rio de Janeiro, Alberto Mota transforma
            sua caminhada em canções sobre afetos, lugares, raízes, recomeços e esperança. Em
            “Andarilho”, cada faixa guarda um pedaço dessa história e da terra que sempre segue
            com ele.
          </p>
          <a
            href="https://open.spotify.com/artist/25fpMEWT6cphVE5FvQKINi"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-sm bg-[#1ed760] px-6 py-3 text-sm font-bold text-[#071b12] transition hover:bg-[#45e879]"
          >
            <span aria-hidden="true">•</span>
            Siga Alberto Mota no Spotify
          </a>
        </div>
      </div>
    </section>
  )
}
