import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import MusicStudio from './MusicStudio'
import MusicProjectItem, { type ProjectWithRelations } from '../components/MusicProjectItem'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [activeView, setActiveView] = useState<'music' | 'generate'>('music')
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [credits, setCredits] = useState<number | null>(null)
  const [creditsError, setCreditsError] = useState(false)

  async function loadProjects() {
    if (!user) return
    const { data, error } = await supabase
      .from('music_projects')
      .select('*, music_versions(*), music_payments(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) {
      setProjects((data as ProjectWithRelations[]) ?? [])
    }
  }

  async function loadCredits() {
    const { data, error } = await supabase.functions.invoke('suno-credits')
    if (error || typeof data?.credits !== 'number') {
      setCreditsError(true)
      return
    }
    setCreditsError(false)
    setCredits(data.credits)
  }

  useEffect(() => {
    void loadProjects()
  }, [user?.id])

  useEffect(() => {
    void loadCredits()
  }, [user?.id])

  // Músicas prontas que ainda usam o link temporário da Suno: guarda uma cópia do áudio no Supabase.
  const archiveAttempted = useRef(new Set<string>())
  useEffect(() => {
    const pending = projects
      .flatMap((project) => project.music_versions ?? [])
      .filter(
        (version) =>
          version.status === 'ready' &&
          version.audio_url &&
          !version.audio_url.includes('/storage/v1/object/public/musicas-geradas/') &&
          !archiveAttempted.current.has(version.id),
      )
    if (pending.length === 0) return
    pending.forEach((version) => archiveAttempted.current.add(version.id))
    void (async () => {
      let archived = false
      for (const version of pending) {
        const { data, error } = await supabase.functions.invoke('archive-audio', { body: { versionId: version.id } })
        if (!error && data?.audioUrl) archived = true
      }
      if (archived) await loadProjects()
    })()
  }, [projects])

  useEffect(() => {
    if (!projects.some((project) => project.status === 'generating' || project.status === 'payment_pending')) return
    const timer = window.setInterval(() => void loadProjects(), 15000)
    return () => window.clearInterval(timer)
  }, [projects, user?.id])

  async function handleCreated() {
    await Promise.all([loadProjects(), loadCredits()])
  }

  return (
    <main className="min-h-screen bg-[#111817] text-paper">
      <header className="border-b border-white/10 bg-navy text-white">
        <div className="container-page flex min-h-20 items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-sm text-white/60 hover:text-white">← Voltar ao site</Link>
            <p className="mt-1 font-semibold">Meu painel</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full border border-gold/50 px-3 py-1.5 text-xs font-semibold text-gold-light"
              title="Créditos restantes na Suno"
            >
              Créditos Suno: {credits !== null ? credits.toLocaleString('pt-BR') : creditsError ? 'indisponível' : '…'}
            </span>
            <span className="hidden text-sm text-white/70 sm:inline">{profile?.display_name || user?.email}</span>
            <button onClick={() => void signOut()} className="rounded-full border border-white/30 px-4 py-2 text-sm transition hover:border-white">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[15rem_1fr]">
        <nav className="self-start rounded-2xl border border-white/10 bg-white/5 p-2" aria-label="Menu do painel">
          <button
            onClick={() => setActiveView('music')}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeView === 'music' ? 'bg-gold text-body' : 'text-paper/70 hover:bg-white/10'}`}
          >
            Minhas músicas
          </button>
          <button
            onClick={() => setActiveView('generate')}
            className={`mt-1 w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${activeView === 'generate' ? 'bg-gold text-body' : 'text-paper/70 hover:bg-white/10'}`}
          >
            Gerar música
          </button>
        </nav>

        <section>
          {activeView === 'music' ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Biblioteca</p>
                  <h1 className="mt-2 text-3xl font-semibold">Minhas músicas</h1>
                  <p className="mt-2 text-paper/60">Acompanhe seus pedidos e futuras versões.</p>
                </div>
                <button onClick={() => setActiveView('generate')} className="header-cta">
                  Gerar música
                </button>
              </div>

              <div className="mt-8 divide-y divide-[#24457a] overflow-hidden rounded-2xl border border-[#24457a] bg-[#0f2547] shadow-lg shadow-black/30">
                {projects.map((project) => <MusicProjectItem key={project.id} project={project} onChanged={loadProjects} />)}
                {projects.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-paper/55">Você ainda não criou nenhuma música.</p>
                    <button onClick={() => setActiveView('generate')} className="mt-4 text-sm font-semibold text-gold-light hover:underline">
                      Criar a primeira música
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <MusicStudio embedded onCreated={handleCreated} />
          )}
        </section>
      </div>
    </main>
  )
}
