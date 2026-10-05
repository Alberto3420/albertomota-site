import { useMemo, useState } from 'react'
import { compareRhyme, rhymeScheme } from '../lib/rhymes'

type Tab = 'guia' | 'rimas'

const KIND_TEXT = {
  consoante: { label: 'Rima consoante (perfeita)', color: 'text-emerald-400', note: 'Os sons são iguais da vogal tônica até o fim.' },
  toante: { label: 'Rima toante', color: 'text-gold-light', note: 'Só as vogais coincidem a partir da tônica; as consoantes mudam.' },
  nenhuma: { label: 'Não rimam', color: 'text-red-400', note: 'Os sons finais não combinam.' },
} as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="text-sm font-semibold text-gold-light">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-6 text-paper/75">{children}</div>
    </section>
  )
}

function Guide() {
  return (
    <div>
      <Section title="Tipos de rima">
        <p><strong>Consoante (perfeita):</strong> iguais da vogal tônica ao fim. <em>amor / dor</em>, <em>coração / paixão</em>.</p>
        <p><strong>Toante:</strong> só as vogais coincidem. <em>casa / fama</em>, <em>tempo / vento</em> (a tônica muda, o som das vogais fica).</p>
        <p><strong>Rica:</strong> palavras de classes gramaticais diferentes, como <em>dor</em> (substantivo) / <em>supor</em> (verbo). <strong>Pobre:</strong> mesma classe, como dois verbos no infinitivo (<em>cantar / chorar</em>). Pobre não é erro: em canção popular funciona bem.</p>
        <p><strong>Esquemas:</strong> AABB (emparelhada), ABAB (alternada), ABBA (interpolada), ABCB (só rimam os versos pares, o mais comum em canção).</p>
      </Section>
      <Section title="Contando sílabas">
        <p>Conta-se <strong>até a última sílaba tônica</strong> do verso. O que vem depois dela não entra.</p>
        <p><strong>Elisão:</strong> vogal final + vogal inicial viram uma só sílaba. <em>"de amor"</em> soa <em>"da-mor"</em>.</p>
        <p><strong>Hiato e ditongo:</strong> <em>sa-í-da</em> tem hiato (3 sílabas); <em>ou-tro</em> tem ditongo (2). Cantando, o músico pode alongar ou unir.</p>
        <p>O contador do editor é estimado e não vê a tônica; use-o para achar versos que destoam.</p>
      </Section>
      <Section title="Métricas comuns">
        <p><strong>Redondilha menor (5):</strong> curta, ágil. Bom para refrão.</p>
        <p><strong>Redondilha maior (7):</strong> a métrica da canção popular e da cantiga. Natural de cantar.</p>
        <p><strong>8 e 9:</strong> comuns no samba e na MPB narrativa.</p>
        <p><strong>Decassílabo (10):</strong> mais solene, para baladas lentas.</p>
        <p>Mantenha os versos de uma estrofe com a mesma contagem (ou diferença de 1). Variar de propósito entre estrofe e refrão dá contraste.</p>
      </Section>
      <Section title="Dicas de composição">
        <p>Refrão curto, fácil de repetir e com a ideia central. Ele pede os versos mais cantáveis.</p>
        <p>Prefira imagens concretas (<em>"a mala na porta"</em>) a sentimentos abstratos (<em>"tristeza profunda"</em>).</p>
        <p>Rima forçada denuncia-se pela inversão da frase. Se precisar torcer, troque a palavra, não a ordem.</p>
        <p>Estrutura clássica: verso → refrão → verso → refrão → ponte → refrão. Use os marcadores do editor.</p>
        <p>Para o Suno: frases curtas, uma ideia por verso, e evite siglas e números, que ele pode ler errado.</p>
      </Section>
    </div>
  )
}

function Rhymes({ lyrics }: { lyrics: string }) {
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const result = first.trim() && second.trim() ? compareRhyme(first, second) : null
  const scheme = useMemo(() => rhymeScheme(lyrics), [lyrics])
  const inputClass = 'w-full rounded-lg border border-[#24457a] bg-[#0a1a33] px-3 py-2 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold'

  return (
    <div>
      <Section title="Duas palavras rimam?">
        <div className="flex gap-2">
          <input value={first} onChange={(event) => setFirst(event.target.value)} className={inputClass} placeholder="amor" aria-label="Primeira palavra" />
          <input value={second} onChange={(event) => setSecond(event.target.value)} className={inputClass} placeholder="dor" aria-label="Segunda palavra" />
        </div>
        {result && (
          <div className="rounded-lg border border-[#24457a] bg-[#0a1a33] p-3">
            <p className={`font-semibold ${KIND_TEXT[result.kind].color}`}>{KIND_TEXT[result.kind].label}</p>
            <p className="mt-1 text-xs text-paper/60">{KIND_TEXT[result.kind].note}</p>
            <p className="mt-2 text-xs text-paper/60">
              Som final: <strong className="text-paper">-{result.soundA}</strong> e <strong className="text-paper">-{result.soundB}</strong>
            </p>
            {result.same && <p className="mt-1 text-xs text-red-400">É a mesma palavra: repetir não conta como rima.</p>}
          </div>
        )}
        <p className="text-xs text-paper/45">Verificação por regra (a tônica é estimada). Palavras como "exceção" ou de outra língua podem errar.</p>
      </Section>

      <Section title="Esquema de rimas da sua letra">
        {scheme.stanzas.length === 0 ? (
          <p className="text-paper/50">Escreva alguns versos e o esquema aparece aqui.</p>
        ) : (
          <div className="space-y-4">
            {scheme.stanzas.map((stanza, index) => (
              <div key={index}>
                <p className="text-xs text-paper/55">
                  Estrofe {index + 1}: <strong className="tracking-widest text-paper">{stanza.map((line) => line.label || '–').join(' ')}</strong>
                </p>
                <ul className="mt-1 space-y-0.5 text-xs">
                  {stanza.map((line, lineIndex) => (
                    <li key={lineIndex} className="flex gap-2">
                      <span className="w-6 shrink-0 text-right font-semibold text-gold">{line.label}</span>
                      <span className="truncate text-paper/65" title={line.text}>{line.word || line.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-paper/45">Letra igual = rima consoante. Letra com ′ = só toante. Marcadores e linhas em branco separam estrofes.</p>
          </div>
        )}
      </Section>
    </div>
  )
}

export default function ManualPanel({ lyrics }: { lyrics: string }) {
  const [tab, setTab] = useState<Tab>('guia')
  const tabClass = (name: Tab) => `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === name ? 'bg-gold text-body' : 'text-paper/70 hover:bg-white/10'}`

  return (
    <aside className="rounded-2xl border border-[#24457a] bg-[#0f2547] p-4 print:hidden xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto" aria-label="Manual de composição">
      <div className="flex gap-1 rounded-xl bg-[#0a1a33] p-1">
        <button onClick={() => setTab('guia')} className={tabClass('guia')}>Guia</button>
        <button onClick={() => setTab('rimas')} className={tabClass('rimas')}>Rimas</button>
      </div>
      <div className="mt-4">{tab === 'guia' ? <Guide /> : <Rhymes lyrics={lyrics} />}</div>
    </aside>
  )
}
