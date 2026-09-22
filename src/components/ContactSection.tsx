export default function ContactSection() {
  return (
    <section id="contato" className="border-t border-[#e6e1da] bg-[#f7f7f5] py-20 md:py-24">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:gap-16">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Contato</span>
          <h2 className="mt-4 text-5xl font-medium leading-tight text-navy md:text-6xl">
            Vamos conversar?
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#536477] md:text-lg">
            Para apresentações, projetos e parcerias, entre em contato diretamente com Alberto Mota.
          </p>
        </div>

        <div className="grid gap-3">
          <a
            href="mailto:albertomota16@gmail.com"
            className="border-l-4 border-gold bg-white px-6 py-5 shadow-lg transition hover:-translate-y-0.5"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#536477]">
              E-mail
            </span>
            <strong className="mt-2 block text-lg text-body md:text-xl">albertomota16@gmail.com</strong>
          </a>
          <a
            href="tel:+5521980995257"
            className="border-l-4 border-gold bg-white px-6 py-5 shadow-lg transition hover:-translate-y-0.5"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#536477]">
              Telefone
            </span>
            <strong className="mt-2 block text-lg text-body md:text-xl">(21) 98099-5257</strong>
          </a>
        </div>
      </div>
    </section>
  )
}