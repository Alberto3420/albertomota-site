import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import MusicStudio from './MusicStudio'
import type { MusicProject, MusicVersion } from '../types/models'

const STATUS_LABELS: Record<MusicProject['status'], string> = {
  draft: 'Rascunho',
  payment_pending: 'Aguardando pagamento',
  queued: 'Na fila',
  generating: 'Gerando',
  ready: 'Pronta',
  failed: 'Falhou',
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [activeView, setActiveView] = useState<'music' | 'generate'>('music')
  const [projects, setProjects] = useState<Array<MusicProject & { music_versions: MusicVersion[] }>>([])

  async function loadProjects() {
    if (!user) return
    const { data, error } = await supabase
      .from('music_projects')
      .select('*, music_versions(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) {
      setProjects((data as Array<MusicProject & { music_versions: MusicVersion[] }>) ?? [])
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [user?.id])

  useEffect(() => {
    if (!projects.some((project) => project.status === 'generating')) return
    const timer = window.setInterval(() => void loadProjects(), 15000)
    return () => window.clearInterval(timer)
  }, [projects, user?.id])

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-navy text-white">
        <div className="container-page flex min-h-20 items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-sm text-white/60 hover:text-white">← Voltar ao site</Link>
            <p className="mt-1 font-semibold">Meu painel</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/70 sm:inline">{profile?.display_name || user?.email}</span>
            <button onClick={() => void signOut()} className="rounded-full border border-white/30 px-4 py-2 text-sm transition hover:border-white">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[15rem_1fr]">
        <nav className="self-start rounded-2xl border border-ink/10 bg-white/50 p-2" aria-label="Menu do painel">
          <button
            onClick={() => setActiveView('music')}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeView === 'music' ? 'bg-ink text-paper' : 'text-ink/70 hover:bg-sand'}`}
          >
            Minhas músicas
          </button>
          <button
            onClick={() => setActiveView('generate')}
            className={`mt-1 w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeView === 'generate' ? 'bg-clay text-paper' : 'text-ink/70 hover:bg-sand'}`}
          >
            Gerar música
          </button>
        </nav>

        <section>
          {activeView === 'music' ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="section-label">Biblioteca</p>
                  <h1 className="mt-2 text-3xl font-semibold">Minhas músicas</h1>
                  <p className="mt-2 text-ink/60">Acompanhe seus pedidos e futuras versões.</p>
                </div>
                <button onClick={() => setActiveView('generate')} className="btn-primary">
                  Gerar música
                </button>
              </div>

              <div className="mt-8 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/50">
                {projects.map((project) => {
                  const versions = [...(project.music_versions ?? [])].sort(
                    (a, b) => a.version_number - b.version_number,
                  )
                  return (
                  <article key={project.id} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-medium">{project.title}</h2>
                      <p className="mt-1 text-sm text-ink/55">Criada em {new Date(project.created_at).toLocaleDateString('pt-BR')}</p>
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
                    {project.status === 'generating' && (
                      <p className="mt-3 text-sm text-ink/55">A Suno está preparando o áudio. Esta lista atualiza automaticamente.</p>
                    )}
                  </article>
                  )
                })}
                {projects.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-ink/55">Você ainda não criou nenhuma música.</p>
                    <button onClick={() => setActiveView('generate')} className="mt-4 text-sm font-semibold text-clay hover:underline">
                      Criar a primeira música
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <MusicStudio embedded onCreated={loadProjects} />
          )}
        </section>
      </div>
    </main>
  )
}
