import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Composition } from '../types/models'
import CompositionCard from './CompositionCard'

const ESTACAO_AUDIO_URL =
  'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/estacao.mp3'
const AUDIO_URLS: Record<string, string> = {
  'Estarei com Você':
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/estarei%20com%20voce%20(1).mp3',
  'As Rosas':
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/as%20rosas.mp3',
  'Hoje é Domingo':
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/domingo.mp3',
  'Contando Estrelas':
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/contando%20estrelas1000.mp3',
  'Procura-se um Cantador':
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/o-cantador.mp3',
  Andarilho:
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/O%20andarilho%20(11).mp3',
  'Quando Penso em Voltar':
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/Quando-eu-voltar.mp3',
  'Meu Mundo, Minha Raiz':
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/meu-lugar.MP3',
  'Não Desista':
    'https://vszdpaithvzsuheaftek.supabase.co/storage/v1/object/public/arquivos/musicas/nao-desista.mp3',
}

const PREVIEW_COMPOSITIONS: Composition[] = [
  ['Na Estação', 'Encontros, despedidas e caminhos que mudam para sempre.', 'na-estacao.png'],
  ['Estarei com Você', 'Uma promessa de presença, cuidado e amor, mesmo quando a distância se faz sentir.', 'estarei-com-voce.png'],
  ['As Rosas', 'Uma canção sobre afeto, delicadeza e lembranças que permanecem.', 'as-rosas.jpeg'],
  ['Hoje é Domingo', 'O tempo desacelera para caber nos afetos mais simples.', 'hoje-e-domingo.png'],
  ['Contando Estrelas', 'Sonhos e esperança sob o silêncio bonito da noite.', 'contando-estrelas.png'],
  ['Procura-se um Cantador', 'A voz de quem segue levando histórias e esperança pelo caminho.', 'procura-se-um-cantador.png'],
  ['Andarilho', 'A faixa-título: estrada, busca, liberdade e encontro consigo mesmo.', 'andarilho-capa.png'],
  ['Quando Penso em Voltar', 'Saudade da terra, das raízes e do lugar que sempre chama.', 'quando-penso-em-voltar.jpeg'],
  ['Meu Mundo, Minha Raiz', 'Uma declaração de pertencimento às origens que formam uma vida.', 'meu-mundo-minha-raiz.png'],
  ['Não Desista', 'Uma mensagem de coragem para continuar, mesmo nos dias difíceis.', 'nao-desista.png'],
].map(([title, description, cover], index) => ({
  id: `preview-${index + 1}`,
  slug: title.toLowerCase().replace(/ /g, '-'),
  title,
  short_description: description,
  story: null,
  lyrics: null,
  cover_url: `/${cover}`,
  audio_url: title === 'Na Estação' ? ESTACAO_AUDIO_URL : AUDIO_URLS[title] ?? null,
  position: index,
  is_featured: title === 'Andarilho',
  created_at: '',
}))

export default function CompositionsGrid() {
  const [compositions, setCompositions] = useState<Composition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('compositions')
      .select('*')
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          // eslint-disable-next-line no-console
          console.error(error)
        }
        setCompositions(data?.length ? (data as Composition[]) : PREVIEW_COMPOSITIONS)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section id="composicoes" className="border-t border-white/10 bg-[#111817] py-20 text-paper">
      <div className="container-page">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Composições de Alberto Mota
        </span>
        <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Dez histórias. Muitos caminhos e sentimentos.</h2>

        {loading && <p className="mt-8 text-ink/50">Carregando composições…</p>}

        <div className="mt-10 divide-y divide-white/15 border-y border-white/15">
          {compositions.map((composition, index) => (
            <CompositionCard key={composition.id} composition={composition} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
