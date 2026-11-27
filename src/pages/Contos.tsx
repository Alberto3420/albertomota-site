import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { ROMANCE_OWNER_EMAIL, RowsSection, wordCount, type FieldDef, type Row } from './Romance'

const WORK_STATUS = ['ideia', 'esboço', 'escrito', 'revisado', 'final']

const WORK_FIELDS: FieldDef[] = [
  { key: 'kind', label: 'Gênero', type: 'select', options: ['conto', 'crônica'], half: true },
  { key: 'status', label: 'Situação', type: 'select', options: WORK_STATUS, half: true },
  { key: 'title', label: 'Título', type: 'text', half: true },
  { key: 'theme', label: 'Tema / tom', type: 'text', half: true, hint: 'Ex.: saudade, humor, cotidiano' },
  { key: 'synopsis', label: 'Sinopse / ideia central', type: 'textarea', rows: 4 },
  { key: 'content', label: 'Texto', type: 'textarea', rows: 24 },
  { key: 'notes', label: 'Anotações', type: 'textarea', rows: 3 },
]

const NOTE_FIELDS_BASE: FieldDef[] = [
  { key: 'kind', label: 'Categoria', type: 'select', options: ['ideia', 'esboço', 'tema', 'pesquisa', 'frase', 'outro'], half: true },
  { key: 'title', label: 'Título', type: 'text', half: true },
  { key: 'body', label: 'Conteúdo', type: 'textarea', rows: 10 },
]

type Tab = 'obras' | 'personagens' | 'cenarios' | 'notas'
const TABS: { id: Tab; label: string }[] = [
  { id: 'obras', label: 'Obras' },
  { id: 'personagens', label: 'Personagens' },
  { id: 'cenarios', label: 'Cenários' },
  { id: 'notas', label: 'Notas' },
]

const byPosition = (a: Row, b: Row) => Number(a.position) - Number(b.position)
const nextPosition = (rows: Row[]) => rows.reduce((m, r) => Math.max(m, Number(r.position)), 0) + 1

export default function Contos({ embedded = false }: { embedded?: boolean }) {
  const { user, profile, signOut } = useAuth()
  const allowed = user?.email?.toLowerCase() === ROMANCE_OWNER_EMAIL

  const [tab, setTab] = useState<Tab>('obras')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [works, setWorks] = useState<Row[]>([])
  const [characters, setCharacters] = useState<Row[]>([])
  const [settings, setSettings] = useState<Row[]>([])
  const [notes, setNotes] = useState<Row[]>([])

  useEffect(() => {
    if (!allowed) return
    void (async () => {
      const [w, c, s, n] = await Promise.all([
        supabase.from('story_works').select('*').order('position', { ascending: true }),
        supabase.from('story_characters').select('*').order('position', { ascending: true }),
        supabase.from('story_settings').select('*').order('position', { ascending: true }),
        supabase.from('story_notes').select('*').order('position', { ascending: true }),
      ])
      if (w.error || c.error || s.error || n.error) {
        setError('Não foi possível carregar. Confirme se o patch SQL de contos e crônicas foi aplicado.')
      } else {
        setWorks((w.data as Row[]) ?? [])
        setCharacters((c.data as Row[]) ?? [])
        setSettings((s.data as Row[]) ?? [])
        setNotes((n.data as Row[]) ?? [])
      }
      setLoading(false)
    })()
  }, [allowed])

  const workChoices = useMemo(
    () => [{ value: '', label: 'Todas as obras (universo comum)' }, ...works.map((w) => ({ value: String(w.id), label: String(w.title || 'Sem título') }))],
    [works],
  )
  const workField: FieldDef = { key: 'work_id', label: 'Pertence à obra', type: 'select', choices: workChoices, nullable: true }

  const characterFields: FieldDef[] = [
    { key: 'name', label: 'Nome', type: 'text', half: true },
    { key: 'kind', label: 'Tipo', type: 'select', options: ['humano', 'animal', 'outro'], half: true },
    { key: 'age', label: 'Idade', type: 'text', half: true },
    { key: 'role', label: 'Papel na história', type: 'text', half: true },
    workField,
    { key: 'description', label: 'Descrição (aparência, jeito, história)', type: 'textarea', rows: 6 },
    { key: 'notes', label: 'Anotações', type: 'textarea', rows: 3 },
  ]
  const settingFields: FieldDef[] = [
    { key: 'name', label: 'Nome do cenário', type: 'text', half: true },
    { key: 'kind', label: 'Tipo', type: 'select', options: ['lugar', 'cidade', 'casa', 'rua', 'natureza', 'outro'], half: true },
    { key: 'era', label: 'Época / momento', type: 'text', half: true },
    workField,
    { key: 'description', label: 'Descrição (cheiros, sons, luz, clima)', type: 'textarea', rows: 6 },
    { key: 'notes', label: 'Anotações', type: 'textarea', rows: 3 },
  ]
  const noteFields: FieldDef[] = [...NOTE_FIELDS_BASE, workField]

  if (!allowed) return <Navigate to="/dashboard" replace />

  const totalWords = works.reduce((sum, w) => sum + wordCount(String(w.content ?? '')), 0)
  const workName = (id: string | number | null) => (id ? String(works.find((w) => w.id === id)?.title || 'Sem título') : 'Universo comum')

  // Painel dinâmico exibido abaixo de cada obra: elenco, cenários e notas ligados a ela.
  const workAside = (work: Row) => {
    const mine = (rows: Row[]) => rows.filter((r) => r.work_id === work.id)
    const shared = (rows: Row[]) => rows.filter((r) => !r.work_id)
    const group = (label: string, rows: Row[], go: Tab) => (
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <button onClick={() => setTab(go)} className="text-xs text-gold-light hover:underline">
            gerenciar
          </button>
        </div>
        {mine(rows).length === 0 && shared(rows).length === 0 ? (
          <p className="mt-2 text-xs text-paper/45">Nenhum ainda.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {mine(rows).map((r) => (
              <span key={r.id} className="rounded-full bg-gold/15 px-3 py-1 text-xs">
                {String(r.name || r.title || 'Sem nome')}
              </span>
            ))}
            {shared(rows).map((r) => (
              <span key={r.id} className="rounded-full border border-white/15 px-3 py-1 text-xs text-paper/60" title="Universo comum">
                {String(r.name || r.title || 'Sem nome')}
              </span>
            ))}
          </div>
        )}
      </div>
    )
    return (
      <div className="space-y-4 rounded-2xl border border-[#24457a] bg-[#0f2547] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Ecossistema desta obra</p>
        {group('Personagens', characters, 'personagens')}
        {group('Cenários', settings, 'cenarios')}
        {group('Notas', notes, 'notas')}
        <p className="text-xs text-paper/40">Destaque dourado = ligado só a esta obra · contorno = universo comum.</p>
      </div>
    )
  }

  return (
    <main className={embedded ? 'text-paper' : 'min-h-screen bg-[#111817] text-paper'}>
      {!embedded && <header className="border-b border-white/10 bg-navy text-white">
        <div className="container-page flex min-h-20 items-center justify-between gap-4">
          <div>
            <Link to="/dashboard" className="text-sm text-white/60 hover:text-white">
              ← Voltar ao painel
            </Link>
            <p className="mt-1 font-semibold">Contos e Crônicas</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/70 sm:inline">{profile?.display_name || user?.email}</span>
            <button onClick={() => void signOut()} className="rounded-full border border-white/30 px-4 py-2 text-sm transition hover:border-white">
              Sair
            </button>
          </div>
        </div>
      </header>}

      <div className={embedded ? '' : 'container-page py-10'}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Escrita</p>
        <h1 className="mt-2 text-3xl font-semibold">Contos e Crônicas</h1>
        <p className="mt-2 text-paper/60">
          {works.length} obras · {characters.length} personagens · {settings.length} cenários · {totalWords.toLocaleString('pt-BR')} palavras escritas
        </p>

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {loading ? (
          <p className="mt-8 text-sm text-paper/50">Carregando…</p>
        ) : (
          !error && (
            <>
              <nav className="mt-8 flex flex-wrap gap-2" aria-label="Seções de contos e crônicas">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition ${tab === t.id ? 'bg-gold text-body' : 'border border-white/20 text-paper/70 hover:border-white/50'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              <div className="mt-6">
                {tab === 'obras' && (
                  <RowsSection
                    table="story_works"
                    rows={works}
                    setRows={setWorks}
                    fields={WORK_FIELDS}
                    itemLabel="a obra"
                    newLabel="+ Nova obra"
                    emptyText="Nenhum conto ou crônica ainda. Crie o primeiro com o botão acima."
                    title={(r) => String(r.title || 'Sem título')}
                    subtitle={(r) => `${r.kind} · ${r.status} · ${wordCount(String(r.content ?? '')).toLocaleString('pt-BR')} palavras`}
                    newDefaults={(rows) => ({ position: nextPosition(rows) })}
                    sort={byPosition}
                    aside={workAside}
                  />
                )}
                {tab === 'personagens' && (
                  <RowsSection
                    table="story_characters"
                    rows={characters}
                    setRows={setCharacters}
                    fields={characterFields}
                    itemLabel="o personagem"
                    newLabel="+ Novo personagem"
                    emptyText="Nenhum personagem ainda."
                    title={(r) => String(r.name || 'Sem nome')}
                    subtitle={(r) => [workName(r.work_id), r.role].filter(Boolean).join(' · ')}
                    newDefaults={(rows) => ({ position: nextPosition(rows) })}
                    sort={byPosition}
                  />
                )}
                {tab === 'cenarios' && (
                  <RowsSection
                    table="story_settings"
                    rows={settings}
                    setRows={setSettings}
                    fields={settingFields}
                    itemLabel="o cenário"
                    newLabel="+ Novo cenário"
                    emptyText="Nenhum cenário ainda."
                    title={(r) => String(r.name || 'Sem nome')}
                    subtitle={(r) => [workName(r.work_id), r.kind].filter(Boolean).join(' · ')}
                    newDefaults={(rows) => ({ position: nextPosition(rows) })}
                    sort={byPosition}
                  />
                )}
                {tab === 'notas' && (
                  <RowsSection
                    table="story_notes"
                    rows={notes}
                    setRows={setNotes}
                    fields={noteFields}
                    itemLabel="a nota"
                    newLabel="+ Nova nota"
                    emptyText="Nenhuma nota ainda."
                    title={(r) => String(r.title || 'Sem título')}
                    subtitle={(r) => [workName(r.work_id), r.kind].filter(Boolean).join(' · ')}
                    newDefaults={(rows) => ({ position: nextPosition(rows) })}
                    sort={byPosition}
                  />
                )}
              </div>
            </>
          )
        )}
      </div>
    </main>
  )
}
