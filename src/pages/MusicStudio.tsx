import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import MusicProjectItem, { type ProjectWithRelations } from '../components/MusicProjectItem'

const GENERATION_PRICE_CENTS = 1990

interface MusicStudioProps {
  embedded?: boolean
  onCreated?: () => void | Promise<void>
}

export default function MusicStudio({ embedded = false, onCreated }: MusicStudioProps) {
  const { user, signOut } = useAuth()
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [title, setTitle] = useState('')
  const [melody, setMelody] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [cpf, setCpf] = useState('')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadProjects() {
    if (!user) return
    const { data } = await supabase
      .from('music_projects')
      .select('*, music_versions(*), music_payments(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects((data as ProjectWithRelations[]) ?? [])
  }

  // Depois de excluir, atualiza esta lista e a do painel (quando o estúdio está embutido nele).
  async function handleProjectsChanged() {
    await loadProjects()
    await onCreated?.()
  }

  useEffect(() => {
    void loadProjects()
  }, [user?.id])

  useEffect(() => {
    if (!projects.some((project) => project.status === 'generating' || project.status === 'payment_pending')) return
    const timer = window.setInterval(() => void loadProjects(), 15000)
    return () => window.clearInterval(timer)
  }, [projects, user?.id])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setPaymentUrl(null)

    if (!user || !title.trim() || !melody.trim() || !lyrics.trim()) {
      setError('Preencha o título, a melodia e a letra.')
      return
    }

    setSaving(true)
    try {
      const { data: created, error: generationError } = await supabase.functions.invoke('generate-music', {
        body: {
          title: title.trim(),
          melody: melody.trim(),
          lyrics: lyrics.trim(),
          cpf: cpf.trim(),
        },
      })
      if (generationError) {
        let details = generationError.message
        if ('context' in generationError && generationError.context instanceof Response) {
          try {
            const responseBody = await generationError.context.json()
            details = responseBody.error ?? responseBody.message ?? details
          } catch {
            // Mantém a mensagem original quando a resposta não for JSON.
          }
        }
        throw new Error(details)
      }

      setTitle('')
      setMelody('')
      setLyrics('')
      if (created?.paymentUrl) {
        setPaymentUrl(created.paymentUrl)
        setMessage('Pedido criado. Faça o pagamento para iniciar a geração; ela começa assim que o pagamento for confirmado.')
      } else {
        setMessage('Pedido enviado. A geração começou e aparecerá aqui quando o áudio estiver pronto.')
      }
      await loadProjects()
      await onCreated?.()
    } catch (submissionError) {
      const details = submissionError instanceof Error ? submissionError.message : 'Erro desconhecido.'
      setError(`Não foi possível criar o pedido: ${details}`)
      // eslint-disable-next-line no-console
      console.error(submissionError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={embedded ? 'py-2' : 'min-h-screen bg-[#111817] text-paper'}>
      <div className={embedded ? '' : 'container-page max-w-5xl py-12'}>
      {!embedded && <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-paper/50 hover:underline">
            ← Voltar ao site
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Estúdio de criação</p>
          <h1 className="mt-2 text-3xl font-semibold">Dê forma à sua música</h1>
          <p className="mt-3 max-w-2xl text-paper/65">
            Envie o título, a ideia melódica e a letra. Cada melhoria ficará registrada como uma nova versão.
          </p>
        </div>
        <button onClick={() => void signOut()} className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:border-white">
          Sair
        </button>
      </div>}

      <form onSubmit={handleSubmit} className="mt-10 grid gap-5 rounded-2xl border border-[#24457a] bg-[#0f2547] p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium" htmlFor="music-title">Título</label>
          <input id="music-title" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-3 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold" placeholder="Ex.: Quando Penso em Voltar" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="music-melody">Melodia e direção musical</label>
          <textarea id="music-melody" value={melody} onChange={(event) => setMelody(event.target.value)} rows={7} className="mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-3 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold" placeholder="Ex.: balada acústica, voz masculina, andamento lento, violão e cordas..." />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="music-lyrics">Letra</label>
          <textarea id="music-lyrics" value={lyrics} onChange={(event) => setLyrics(event.target.value)} rows={7} className="mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-3 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold" placeholder="Cole ou escreva a letra da música..." />
        </div>
        <div className="md:col-span-2 md:max-w-xs">
          <label className="text-sm font-medium" htmlFor="music-cpf">CPF ou CNPJ (para o pagamento)</label>
          <input id="music-cpf" value={cpf} onChange={(event) => setCpf(event.target.value)} inputMode="numeric" autoComplete="off" className="mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-3 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold" placeholder="Somente números" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
          <p className="text-sm text-paper/55">Valor por música: R$ {(GENERATION_PRICE_CENTS / 100).toFixed(2).replace('.', ',')} (Pix ou cartão)</p>
          <button type="submit" disabled={saving} className="header-cta disabled:opacity-60">
            {saving ? 'Criando pedido…' : 'Criar pedido de geração'}
          </button>
        </div>
        {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}
        {message && <p className="text-sm text-emerald-400 md:col-span-2">{message}</p>}
        {paymentUrl && (
          <a href={paymentUrl} target="_blank" rel="noreferrer" className="header-cta w-fit md:col-span-2">
            Pagar agora
          </a>
        )}
      </form>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Meus projetos</h2>
        <div className="mt-4 divide-y divide-[#24457a] overflow-hidden rounded-2xl border border-[#24457a] bg-[#0f2547] shadow-lg shadow-black/30">
          {projects.map((project) => <MusicProjectItem key={project.id} project={project} onChanged={handleProjectsChanged} />)}
          {projects.length === 0 && <p className="p-5 text-sm text-paper/50">Seus pedidos aparecerão aqui.</p>}
        </div>
      </section>
      </div>
    </main>
  )
}
