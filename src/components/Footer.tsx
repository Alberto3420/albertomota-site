export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy py-14 text-white md:py-16">
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <img src="/logo-alberto-mota.png" alt="Alberto Mota" className="h-14 w-auto object-contain" />
            <p className="mt-5 max-w-sm text-sm text-white/75">
              Composição e interpretação com raízes, verdade e propósito.
            </p>
          </div>

          <nav aria-label="Navegação do rodapé">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Navegue</p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/80">
              <a href="#metodo" className="transition hover:text-gold-light">Método Alberto Mota</a>
              <a href="#composicoes" className="transition hover:text-gold-light">Composições</a>
              <a href="#comentarios" className="transition hover:text-gold-light">Comentários</a>
              <a href="#sobre" className="transition hover:text-gold-light">Sobre Alberto Mota</a>
              <a href="#contato" className="transition hover:text-gold-light">Contato</a>
            </div>
          </nav>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Conecte-se</p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/80">
              <a href="https://open.spotify.com/artist/25fpMEWT6cphVE5FvQKINi" target="_blank" rel="noreferrer" className="transition hover:text-gold-light">
                <span className="text-[#1ed760]">•</span> Spotify
              </a>
              <a href="https://www.tiktok.com/@alberto_mota820" target="_blank" rel="noreferrer" className="transition hover:text-gold-light">
                TikTok
              </a>
              <a href="mailto:albertomota16@gmail.com" className="transition hover:text-gold-light">
                E-mail
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 border-y border-white/15 py-5 text-center text-sm text-white/75">
          “As pessoas podem esquecer nossos nomes, mas dificilmente esquecem aquilo que as ajudou a mudar de vida.”
        </div>
      </div>

      <div className="container-page mt-10 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Alberto Mota — Todos os direitos reservados.
      </div>
    </footer>
  )
}
