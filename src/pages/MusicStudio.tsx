import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import type { MusicProject, MusicVersion } from '../types/models'

type MusicProjectWithVersions = MusicProject & { music_versions: MusicVersion[] }

const GENERATION_PRICE_CENTS = 1990

const STATUS_LABELS: Record<MusicProject['status'], string> = {
  draft: 'Rascunho',
  payment_pending: 'Aguardando pagamento',
  queued: 'Na fila',
  generating: 'Gerando',
  ready: 'Pronta',
  failed: 'Falhou',
}

interface MusicStudioProps {
  embedded?: boolean
  onCreated?: () => void | Promise<void>
}

export default function MusicStudio({ embedded = false, onCreated }: MusicStudioProps) {
  const { user, signOut } = useAuth()
  const [projects, setProjects] = useState<MusicProjectWithVersions[]>([])
  const [title, setTitle] = useState('')
  const [melody, setMelody] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadProjects() {
    if (!user) return
    const { data } = await supabase
      .from('music_projects')
      .select('*, music_versions(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects((data as MusicProjectWithVersions[]) ?? [])
  }

  useEffect(() => {
    void loadProjects()
  }, [user?.id])

  useEffect(() => {
    if (!projects.some((project) => project.status === 'generating')) return
    const timer = window.setInterval(() => void loadProjects(), 15000)
    return () => window.clearInterval(timer)
  }, [projects, user?.id])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!user || !title.trim() || !melody.trim() || !lyrics.trim()) {
      setError('Preencha o título, a melodia e a letra.')
      return
    }

    setSaving(true)
    try {
      const { error: generationError } = await supabase.functions.invoke('generate-music', {
        body: {
          title: title.trim(),
          melody: melody.trim(),
          lyrics: lyrics.trim(),
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
      setMessage('Pedido enviado. A geração começou e aparecerá aqui quando o áudio estiver pronto.')
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
    <main className={embedded ? 'py-2' : 'container-page max-w-5xl py-12'}>
      {!embedded && <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-ink/50 hover:underline">
            ← Voltar ao site
          </Link>
          <p className="section-label mt-6">Estúdio de criação</p>
          <h1 className="mt-2 text-3xl font-semibold">Dê forma à sua música</h1>
          <p className="mt-3 max-w-2xl text-ink/65">
            Envie o título, a ideia melódica e a letra. Cada melhoria ficará registrada como uma nova versão.
          </p>
        </div>
        <button onClick={() => void signOut()} className="btn-secondary">
          Sair
        </button>
      </div>}

      <form onSubmit={handleSubmit} className="mt-10 grid gap-5 rounded-2xl border border-ink/10 bg-white/50 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium" htmlFor="music-title">Título</label>
          <input id="music-title" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-clay" placeholder="Ex.: Quando Penso em Voltar" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="music-melody">Melodia e direção musical</label>
          <textarea id="music-melody" value={melody} onChange={(event) => setMelody(event.target.value)} rows={7} className="mt-1 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-clay" placeholder="Ex.: balada acústica, voz masculina, andamento lento, violão e cordas..." />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="music-lyrics">Letra</label>
          <textarea id="music-lyrics" value={lyrics} onChange={(event) => setLyrics(event.target.value)} rows={7} className="mt-1 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm outline-none focus:border-clay" placeholder="Cole ou escreva a letra da música..." />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
          <p className="text-sm text-ink/55">Primeira geração: R$ {(GENERATION_PRICE_CENTS / 100).toFixed(2).replace('.', ',')}</p>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Criando pedido…' : 'Criar pedido de geração'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
        {message && <p className="text-sm text-moss md:col-span-2">{message}</p>}
      </form>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Meus projetos</h2>
        <div className="mt-4 divide-y divide-ink/10 rounded-2xl border border-ink/10">
          {projects.map((project) => {
            const versions = [...(project.music_versions ?? [])].sort(
              (a, b) => a.version_number - b.version_number,
            )
            return (
              <article key={project.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="mt-1 text-sm text-ink/55">Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-ink/70">{STATUS_LABELS[project.status]}</span>
                </div>
                {versions.length > 0 && (
                  <div className="mt-4 grid gap-4 border-t border-ink/10 pt-4 sm:grid-cols-2">
                    {versions.map((version) => (
                      <div key={version.id} className="rounded-xl border border-ink/10 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink/45">Versão {version.version_number}</p>
                        {version.audio_url ? (
                          <>
                            <audio controls className="mt-3 w-full" src={version.audio_url} />
                            <a
                              href={version.audio_url}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="mt-3 inline-flex text-sm font-semibold text-clay hover:underline"
                            >
                              Abrir ou baixar áudio
                            </a>
                          </>
                        ) : version.status === 'failed' ? (
                          <p className="mt-3 text-sm text-red-600">{version.error_message ?? 'Falha na geração.'}</p>
                        ) : (
                          <p className="mt-3 text-sm text-ink/55">Gerando áudio…</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
          {projects.length === 0 && <p className="p-5 text-sm text-ink/50">Seus pedidos aparecerão aqui.</p>}
        </div>
      </section>
    </main>
  )
}
