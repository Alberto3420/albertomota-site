import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ConfirmDialog from '../components/ConfirmDialog'
import LyricsEditor from '../components/LyricsEditor'
import ManualPanel from '../components/ManualPanel'

interface MusicDraft {
  id: string
  title: string
  melody: string
  lyrics: string
  used_at: string | null
  updated_at: string
}

type SaveState = 'saved' | 'dirty' | 'saving' | 'error'

const SAVE_LABEL: Record<SaveState, string> = {
  saved: 'Salvo',
  dirty: 'Alterações não salvas…',
  saving: 'Salvando…',
  error: 'Erro ao salvar — tentando de novo na próxima alteração',
}

const inputClass =
  'mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-3 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface DraftEditorProps {
  draft: MusicDraft
  onSaved: (draft: MusicDraft) => void
  onUse: (draft: MusicDraft) => void
  onDelete: (draft: MusicDraft) => void
}

// Editor de um rascunho; o pai usa key={draft.id}, então o estado é reiniciado ao trocar de rascunho.
function DraftEditor({ draft, onSaved, onUse, onDelete }: DraftEditorProps) {
  const [title, setTitle] = useState(draft.title)
  const [melody, setMelody] = useState(draft.melody)
  const [lyrics, setLyrics] = useState(draft.lyrics)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [showManual, setShowManual] = useState(false)
  const latest = useRef({ title, melody, lyrics })
  const dirty = useRef(false)
  const timer = useRef<number>()
  const mounted = useRef(true)

  async function save() {
    window.clearTimeout(timer.current)
    if (!dirty.current) return
    dirty.current = false
    if (mounted.current) setSaveState('saving')
    const fields = { ...latest.current, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('music_drafts').update(fields).eq('id', draft.id)
    if (error) {
      dirty.current = true
      if (mounted.current) setSaveState('error')
      return
    }
    onSaved({ ...draft, ...fields })
    if (mounted.current && !dirty.current) setSaveState('saved')
  }
  const saveRef = useRef(save)
  saveRef.current = save

  function edit(fields: Partial<typeof latest.current>) {
    latest.current = { ...latest.current, ...fields }
    dirty.current = true
    setSaveState('dirty')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void saveRef.current(), 800)
  }

  // Ao sair do editor (trocar de rascunho, ir para outra tela), grava o que ainda estiver pendente.
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      void saveRef.current()
    }
  }, [])

  async function handleUse() {
    await save()
    onUse({ ...draft, ...latest.current })
  }

  return (
    <>
    <div className={`grid items-start gap-6 print:hidden ${showManual ? 'xl:grid-cols-[1fr_22rem]' : ''}`}>
    <div className="rounded-2xl border border-[#24457a] bg-[#0f2547] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs ${saveState === 'error' ? 'text-red-400' : 'text-paper/50'}`} aria-live="polite">
          {SAVE_LABEL[saveState]}
        </span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowManual((value) => !value)} aria-pressed={showManual} className={`rounded-full border px-4 py-2 text-sm transition hover:border-gold hover:text-gold ${showManual ? 'border-gold text-gold' : 'border-white/30'}`}>
            Manual
          </button>
          <button onClick={() => window.print()} className="rounded-full border border-white/30 px-4 py-2 text-sm transition hover:border-gold hover:text-gold">
            Imprimir / salvar PDF
          </button>
          <button onClick={() => onDelete(draft)} className="rounded-full border border-white/30 px-4 py-2 text-sm transition hover:border-red-400 hover:text-red-400">
            Excluir
          </button>
          <button onClick={() => void handleUse()} className="header-cta">
            Usar para gerar música
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <div>
          <label className="text-sm font-medium" htmlFor="draft-title">Título</label>
          <input id="draft-title" value={title} onChange={(event) => { setTitle(event.target.value); edit({ title: event.target.value }) }} className={inputClass} placeholder="Ex.: Quando Penso em Voltar" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="draft-melody">Melodia e direção musical</label>
          <textarea id="draft-melody" value={melody} onChange={(event) => { setMelody(event.target.value); edit({ melody: event.target.value }) }} rows={4} className={inputClass} placeholder="Ex.: balada acústica, voz masculina, andamento lento, violão e cordas..." />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="draft-lyrics">Letra</label>
          <div className="mt-1">
            <LyricsEditor id="draft-lyrics" value={lyrics} onChange={(value) => { setLyrics(value); edit({ lyrics: value }) }} />
          </div>
        </div>
      </div>
    </div>
    {showManual && <ManualPanel lyrics={lyrics} />}
    </div>

    <article className="hidden text-black print:block">
      <h1 className="text-3xl font-bold">{title.trim() || 'Sem título'}</h1>
      {melody.trim() && (
        <p className="mt-3 text-sm italic text-gray-700"><strong className="not-italic">Direção musical:</strong> {melody}</p>
      )}
      <pre className="mt-6 whitespace-pre-wrap font-sans text-base leading-7">{lyrics}</pre>
    </article>
    </>
  )
}

export default function Drafts() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<MusicDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<MusicDraft | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    void (async () => {
      const { data, error: loadError } = await supabase
        .from('music_drafts')
        .select('id, title, melody, lyrics, used_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (loadError) setError('Não foi possível carregar os rascunhos. Tente novamente em instantes.')
      else {
        setDrafts((data as MusicDraft[]) ?? [])
        setSelectedId((data as MusicDraft[] | null)?.[0]?.id ?? null)
      }
      setLoading(false)
    })()
  }, [user?.id])

  async function handleNew() {
    if (!user) return
    setError(null)
    const { data, error: insertError } = await supabase.from('music_drafts').insert({ user_id: user.id }).select('id, title, melody, lyrics, used_at, updated_at').single()
    if (insertError || !data) {
      setError('Não foi possível criar o rascunho.')
      return
    }
    setDrafts((current) => [data as MusicDraft, ...current])
    setSelectedId((data as MusicDraft).id)
  }

  function handleSaved(saved: MusicDraft) {
    setDrafts((current) => current.map((item) => (item.id === saved.id ? saved : item)).sort((a, b) => b.updated_at.localeCompare(a.updated_at)))
  }

  function handleUse(draft: MusicDraft) {
    navigate('/dashboard', { state: { draft: { id: draft.id, title: draft.title, melody: draft.melody, lyrics: draft.lyrics } } })
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError(null)
    const { error: deleteFailure } = await supabase.from('music_drafts').delete().eq('id', toDelete.id)
    setDeleting(false)
    if (deleteFailure) {
      setDeleteError('Não foi possível excluir. Tente novamente.')
      return
    }
    const remaining = drafts.filter((item) => item.id !== toDelete.id)
    setDrafts(remaining)
    if (selectedId === toDelete.id) setSelectedId(remaining[0]?.id ?? null)
    setToDelete(null)
  }

  const selected = drafts.find((item) => item.id === selectedId) ?? null

  return (
    <main className="min-h-screen bg-[#111817] text-paper print:bg-white print:text-black">
      <header className="border-b border-white/10 bg-navy text-white print:hidden">
        <div className="container-page flex min-h-20 items-center justify-between gap-4">
          <div>
            <Link to="/dashboard" className="text-sm text-white/60 hover:text-white">← Voltar ao painel</Link>
            <p className="mt-1 font-semibold">Rascunhos</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/70 sm:inline">{profile?.display_name || user?.email}</span>
            <button onClick={() => void signOut()} className="rounded-full border border-white/30 px-4 py-2 text-sm transition hover:border-white">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container-page py-10 print:py-0">
        <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Caderno de composição</p>
            <h1 className="mt-2 text-3xl font-semibold">Meus rascunhos</h1>
            <p className="mt-2 text-paper/60">Escreva com calma; tudo é salvo sozinho. Quando estiver pronto, use o rascunho para gerar a música.</p>
          </div>
          <button onClick={() => void handleNew()} className="header-cta">+ Novo rascunho</button>
        </div>

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {loading ? (
          <p className="mt-8 text-sm text-paper/50">Carregando…</p>
        ) : drafts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#24457a] bg-[#0f2547] p-8 text-center">
            <p className="text-sm text-paper/55">Você ainda não tem rascunhos.</p>
            <button onClick={() => void handleNew()} className="mt-4 text-sm font-semibold text-gold-light hover:underline">Criar o primeiro rascunho</button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr] print:block">
            <ul className="self-start overflow-hidden rounded-2xl border border-[#24457a] bg-[#0f2547] print:hidden">
              {drafts.map((item) => (
                <li key={item.id} className="border-b border-[#24457a] last:border-b-0">
                  <button
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full px-4 py-3 text-left transition ${item.id === selectedId ? 'bg-gold/15' : 'hover:bg-white/5'}`}
                  >
                    <p className="truncate text-sm font-medium">{item.title.trim() || 'Sem título'}</p>
                    <p className="mt-0.5 text-xs text-paper/45">
                      {formatDate(item.updated_at)}
                      {item.used_at && ' · já usado para gerar'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            {selected && (
              <DraftEditor
                key={selected.id}
                draft={selected}
                onSaved={handleSaved}
                onUse={handleUse}
                onDelete={(draft) => { setDeleteError(null); setToDelete(draft) }}
              />
            )}
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Excluir rascunho"
          message={`Excluir "${toDelete.title.trim() || 'Sem título'}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          busy={deleting}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </main>
  )
}
