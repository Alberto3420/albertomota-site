import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import ConfirmDialog from '../components/ConfirmDialog'

export const ROMANCE_OWNER_EMAIL = 'omegasist1516@gmail.com'

export type Row = { id: string } & Record<string, string | number | null>
type SaveState = 'saved' | 'dirty' | 'saving' | 'error'
type TableName = string

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  rows?: number
  options?: string[]
  /** Opções com valor diferente do rótulo (ex.: ids). */
  choices?: { value: string; label: string }[]
  /** Grava '' como null (colunas uuid opcionais). */
  nullable?: boolean
  hint?: string
  half?: boolean
}

const SAVE_LABEL: Record<SaveState, string> = {
  saved: 'Salvo',
  dirty: 'Alterações não salvas…',
  saving: 'Salvando…',
  error: 'Erro ao salvar — tentando de novo na próxima alteração',
}

const inputClass =
  'mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-3 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold'

const NOVEL_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Título', type: 'text', half: true },
  { key: 'subtitle', label: 'Subtítulo', type: 'text', half: true },
  { key: 'author', label: 'Autor', type: 'text', half: true },
  { key: 'setting', label: 'Ambiente (lugar e época)', type: 'text', half: true },
  { key: 'logline', label: 'Resumo em uma frase', type: 'textarea', rows: 2 },
  { key: 'synopsis', label: 'Premissa / sinopse', type: 'textarea', rows: 8 },
  { key: 'notes', label: 'Anotações gerais', type: 'textarea', rows: 5 },
]

const CHAPTER_STATUS = ['ideia', 'esboço', 'escrito', 'revisado', 'final']

const CHAPTER_FIELDS: FieldDef[] = [
  { key: 'number', label: 'Nº', type: 'number', half: true },
  { key: 'status', label: 'Situação', type: 'select', options: CHAPTER_STATUS, half: true },
  { key: 'title', label: 'Título', type: 'text' },
  { key: 'synopsis', label: 'Sinopse', type: 'textarea', rows: 3 },
  { key: 'content', label: 'Texto do capítulo', type: 'textarea', rows: 24 },
  { key: 'notes', label: 'Anotações', type: 'textarea', rows: 3 },
]

const CHARACTER_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nome', type: 'text', half: true },
  { key: 'kind', label: 'Tipo', type: 'select', options: ['humano', 'cachorro', 'outro animal', 'outro'], half: true },
  { key: 'breed', label: 'Raça / espécie', type: 'text', half: true },
  { key: 'age', label: 'Idade', type: 'text', half: true },
  { key: 'role', label: 'Papel na história', type: 'text' },
  { key: 'chapters', label: 'Aparece nos capítulos', type: 'text', hint: 'Ex.: 1, 5, 11' },
  { key: 'description', label: 'Descrição', type: 'textarea', rows: 5 },
  { key: 'notes', label: 'Anotações', type: 'textarea', rows: 3 },
]

const NOTE_FIELDS: FieldDef[] = [
  { key: 'kind', label: 'Categoria', type: 'select', options: ['ideia', 'lugar', 'tema', 'linha do tempo', 'pesquisa', 'outro'], half: true },
  { key: 'title', label: 'Título', type: 'text', half: true },
  { key: 'body', label: 'Conteúdo', type: 'textarea', rows: 10 },
]

export interface RowEditorProps {
  table: TableName
  row: Row
  fields: FieldDef[]
  onSaved: (row: Row) => void
  onDelete?: (row: Row) => void
  deleteLabel?: string
}

// O pai usa key={row.id}; o estado é reiniciado ao trocar de item.
export function RowEditor({ table, row, fields, onSaved, onDelete, deleteLabel = 'Excluir' }: RowEditorProps) {
  const [values, setValues] = useState<Row>(row)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const latest = useRef<Row>(row)
  const dirty = useRef(false)
  const timer = useRef<number>()
  const mounted = useRef(true)

  async function save() {
    window.clearTimeout(timer.current)
    if (!dirty.current) return
    dirty.current = false
    if (mounted.current) setSaveState('saving')
    const { id, ...rest } = latest.current
    const fieldsToSave: Record<string, string | number | null> = { updated_at: new Date().toISOString() }
    for (const f of fields) {
      const v = rest[f.key] as string | number | null
      fieldsToSave[f.key] = f.nullable && v === '' ? null : v
    }
    const { error } = await supabase.from(table).update(fieldsToSave).eq('id', id)
    if (error) {
      dirty.current = true
      if (mounted.current) setSaveState('error')
      return
    }
    onSaved({ ...latest.current, ...fieldsToSave } as Row)
    if (mounted.current && !dirty.current) setSaveState('saved')
  }
  const saveRef = useRef(save)
  saveRef.current = save

  function edit(key: string, value: string | number) {
    latest.current = { ...latest.current, [key]: value }
    setValues(latest.current)
    dirty.current = true
    setSaveState('dirty')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void saveRef.current(), 800)
  }

  // Ao sair do editor, grava o que ainda estiver pendente.
  useEffect(() => {
    mounted.current = true
    const flush = () => {
      if (dirty.current) void saveRef.current()
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      mounted.current = false
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [])

  return (
    <div className="rounded-2xl border border-[#24457a] bg-[#0f2547] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs ${saveState === 'error' ? 'text-red-400' : 'text-paper/50'}`}>{SAVE_LABEL[saveState]}</span>
        {onDelete && (
          <button onClick={() => onDelete(row)} className="text-sm font-medium text-red-400 hover:underline">
            {deleteLabel}
          </button>
        )}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `${table}-${row.id}-${f.key}`
          const value = values[f.key] ?? ''
          return (
            <div key={f.key} className={f.half ? '' : 'sm:col-span-2'}>
              <label htmlFor={id} className="text-sm font-medium">
                {f.label}
              </label>
              {f.type === 'textarea' ? (
                <textarea id={id} value={String(value)} rows={f.rows ?? 4} onChange={(e) => edit(f.key, e.target.value)} className={inputClass} />
              ) : f.type === 'select' ? (
                <select id={id} value={String(value)} onChange={(e) => edit(f.key, e.target.value)} className={inputClass}>
                  {f.choices
                    ? f.choices.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))
                    : f.options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                </select>
              ) : f.type === 'number' ? (
                <input id={id} type="number" min={1} value={String(value)} onChange={(e) => edit(f.key, Number(e.target.value) || 0)} className={inputClass} />
              ) : (
                <input id={id} value={String(value)} placeholder={f.hint} onChange={(e) => edit(f.key, e.target.value)} className={inputClass} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface RowsSectionProps {
  table: TableName
  novelId?: string
  /** Colunas fixas enviadas ao criar um item (alternativa a novelId). */
  base?: Record<string, string | number>
  /** Conteúdo extra abaixo do editor do item selecionado. */
  aside?: (row: Row) => React.ReactNode
  rows: Row[]
  setRows: (updater: (current: Row[]) => Row[]) => void
  fields: FieldDef[]
  itemLabel: string
  newLabel: string
  emptyText: string
  title: (row: Row) => string
  subtitle?: (row: Row) => string
  newDefaults: (rows: Row[]) => Record<string, string | number>
  sort: (a: Row, b: Row) => number
}

export function RowsSection({ table, novelId, base, aside, rows, setRows, fields, itemLabel, newLabel, emptyText, title, subtitle, newDefaults, sort }: RowsSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleNew() {
    setError(null)
    const { data, error: insertError } = await supabase
      .from(table)
      .insert({ ...(novelId ? { novel_id: novelId } : {}), ...base, ...newDefaults(rows) })
      .select('*')
      .single()
    if (insertError || !data) {
      setError(`Não foi possível criar ${itemLabel}.`)
      return
    }
    setRows((current) => [...current, data as Row].sort(sort))
    setSelectedId((data as Row).id)
  }

  function handleSaved(saved: Row) {
    setRows((current) => current.map((r) => (r.id === saved.id ? saved : r)).sort(sort))
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError(null)
    const { error: failure } = await supabase.from(table).delete().eq('id', toDelete.id)
    setDeleting(false)
    if (failure) {
      setDeleteError('Não foi possível excluir. Tente novamente.')
      return
    }
    const remaining = rows.filter((r) => r.id !== toDelete.id)
    setRows(() => remaining)
    if (selectedId === toDelete.id) setSelectedId(remaining[0]?.id ?? null)
    setToDelete(null)
  }

  const selected = rows.find((r) => r.id === selectedId) ?? null

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-paper/60">
          {rows.length} {rows.length === 1 ? 'item' : 'itens'}
        </p>
        <button onClick={() => void handleNew()} className="header-cta">
          {newLabel}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#24457a] bg-[#0f2547] p-8 text-center text-sm text-paper/55">{emptyText}</div>
      ) : (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
          <ul className="max-h-[70vh] self-start overflow-y-auto rounded-2xl border border-[#24457a] bg-[#0f2547]">
            {rows.map((r) => (
              <li key={r.id} className="border-b border-[#24457a] last:border-b-0">
                <button onClick={() => setSelectedId(r.id)} className={`w-full px-4 py-3 text-left transition ${r.id === selectedId ? 'bg-gold/15' : 'hover:bg-white/5'}`}>
                  <p className="truncate text-sm font-medium">{title(r)}</p>
                  {subtitle && <p className="mt-0.5 truncate text-xs text-paper/45">{subtitle(r)}</p>}
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <div className="min-w-0 space-y-6">
              <RowEditor key={selected.id} table={table} row={selected} fields={fields} onSaved={handleSaved} onDelete={setToDelete} />
              {aside?.(selected)}
            </div>
          )}
        </div>
      )}
      {toDelete && (
        <ConfirmDialog
          title={`Excluir ${itemLabel}?`}
          message={`"${title(toDelete)}" será removido definitivamente.`}
          confirmLabel="Excluir"
          busy={deleting}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}

type Tab = 'geral' | 'capitulos' | 'personagens' | 'notas'
const TABS: { id: Tab; label: string }[] = [
  { id: 'geral', label: 'Visão geral' },
  { id: 'capitulos', label: 'Capítulos' },
  { id: 'personagens', label: 'Personagens' },
  { id: 'notas', label: 'Notas' },
]

export function wordCount(text: string) {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

export default function Romance() {
  const { user, profile, signOut } = useAuth()
  const allowed = user?.email?.toLowerCase() === ROMANCE_OWNER_EMAIL

  const [tab, setTab] = useState<Tab>('geral')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [novels, setNovels] = useState<Row[]>([])
  const [novelId, setNovelId] = useState<string | null>(null)
  const [childrenLoading, setChildrenLoading] = useState(false)
  const [chapters, setChapters] = useState<Row[]>([])
  const [characters, setCharacters] = useState<Row[]>([])
  const [notes, setNotes] = useState<Row[]>([])
  const novel = novels.find((n) => n.id === novelId) ?? null

  useEffect(() => {
    if (!allowed) return
    void (async () => {
      const { data, error: novelError } = await supabase.from('novels').select('*').order('created_at', { ascending: true })
      if (novelError) {
        setError('Não foi possível carregar o romance. Confirme se o patch SQL do romance foi aplicado.')
      } else {
        const list = (data as Row[]) ?? []
        setNovels(list)
        setNovelId(list[0]?.id ?? null)
      }
      setLoading(false)
    })()
  }, [allowed])

  // Carrega capítulos, personagens e notas do romance selecionado.
  useEffect(() => {
    if (!novelId) return
    let cancelled = false
    setChildrenLoading(true)
    void (async () => {
      const [c, p, n] = await Promise.all([
        supabase.from('novel_chapters').select('*').eq('novel_id', novelId).order('number', { ascending: true }),
        supabase.from('novel_characters').select('*').eq('novel_id', novelId).order('position', { ascending: true }),
        supabase.from('novel_notes').select('*').eq('novel_id', novelId).order('position', { ascending: true }),
      ])
      if (cancelled) return
      setChapters((c.data as Row[]) ?? [])
      setCharacters((p.data as Row[]) ?? [])
      setNotes((n.data as Row[]) ?? [])
      setChildrenLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [novelId])

  if (!allowed) return <Navigate to="/dashboard" replace />

  async function createNovel() {
    setError(null)
    const { data, error: insertError } = await supabase.from('novels').insert({ title: 'Novo romance' }).select('*').single()
    if (insertError || !data) {
      setError('Não foi possível criar o romance.')
      return
    }
    setNovels((current) => [...current, data as Row])
    setNovelId((data as Row).id)
    setTab('geral')
  }

  function selectNovel(id: string) {
    if (id === novelId) return
    setNovelId(id)
    setTab('geral')
  }

  function handleNovelSaved(saved: Row) {
    setNovels((current) => current.map((n) => (n.id === saved.id ? saved : n)))
  }

  const totalWords = chapters.reduce((sum, c) => sum + wordCount(String(c.content ?? '')), 0)
  const byPosition = (a: Row, b: Row) => Number(a.position) - Number(b.position)

  return (
    <main className="min-h-screen bg-[#111817] text-paper">
      <header className="border-b border-white/10 bg-navy text-white">
        <div className="container-page flex min-h-20 items-center justify-between gap-4">
          <div>
            <Link to="/dashboard" className="text-sm text-white/60 hover:text-white">
              ← Voltar ao painel
            </Link>
            <p className="mt-1 font-semibold">Romance</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/70 sm:inline">{profile?.display_name || user?.email}</span>
            <button onClick={() => void signOut()} className="rounded-full border border-white/30 px-4 py-2 text-sm transition hover:border-white">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container-page py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Escrita</p>
        <h1 className="mt-2 text-3xl font-semibold">{novel ? String(novel.title || 'Sem título') : 'Romance'}</h1>
        {novel && (
          <p className="mt-2 text-paper/60">
            {chapters.length} capítulos · {characters.length} personagens · {totalWords.toLocaleString('pt-BR')} palavras escritas
          </p>
        )}

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {loading ? (
          <p className="mt-8 text-sm text-paper/50">Carregando…</p>
        ) : !novel ? (
          !error && (
            <div className="mt-8 rounded-2xl border border-[#24457a] bg-[#0f2547] p-8 text-center">
              <p className="text-sm text-paper/55">Nenhum romance cadastrado ainda.</p>
              <button onClick={() => void createNovel()} className="mt-4 text-sm font-semibold text-gold-light hover:underline">
                Criar romance
              </button>
            </div>
          )
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-center gap-2" aria-label="Romances">
              {novels.map((n) => (
                <button
                  key={n.id}
                  onClick={() => selectNovel(n.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${n.id === novelId ? 'bg-white/15 text-white ring-1 ring-gold' : 'border border-white/15 text-paper/60 hover:border-white/40'}`}
                >
                  {String(n.title || 'Sem título')}
                </button>
              ))}
              <button onClick={() => void createNovel()} className="rounded-xl border border-dashed border-gold/60 px-4 py-2 text-sm font-semibold text-gold-light transition hover:bg-gold/10">
                + Novo romance
              </button>
            </div>

            <nav className="mt-8 flex flex-wrap gap-2" aria-label="Seções do romance">
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
              {tab === 'geral' && <RowEditor key={novel.id} table="novels" row={novel} fields={NOVEL_FIELDS} onSaved={handleNovelSaved} />}
              {tab !== 'geral' && childrenLoading && <p className="text-sm text-paper/50">Carregando…</p>}
              {tab === 'capitulos' && !childrenLoading && (
                <RowsSection
                  key={novel.id}
                  table="novel_chapters"
                  novelId={String(novel.id)}
                  rows={chapters}
                  setRows={setChapters}
                  fields={CHAPTER_FIELDS}
                  itemLabel="o capítulo"
                  newLabel="+ Novo capítulo"
                  emptyText="Nenhum capítulo ainda."
                  title={(r) => `${r.number}. ${r.title || 'Sem título'}`}
                  subtitle={(r) => `${r.status} · ${wordCount(String(r.content ?? '')).toLocaleString('pt-BR')} palavras`}
                  newDefaults={(rows) => ({ number: rows.reduce((m, r) => Math.max(m, Number(r.number)), 0) + 1 })}
                  sort={(a, b) => Number(a.number) - Number(b.number)}
                />
              )}
              {tab === 'personagens' && !childrenLoading && (
                <RowsSection
                  key={novel.id}
                  table="novel_characters"
                  novelId={String(novel.id)}
                  rows={characters}
                  setRows={setCharacters}
                  fields={CHARACTER_FIELDS}
                  itemLabel="o personagem"
                  newLabel="+ Novo personagem"
                  emptyText="Nenhum personagem ainda."
                  title={(r) => String(r.name || 'Sem nome')}
                  subtitle={(r) => [r.kind, r.role].filter(Boolean).join(' · ')}
                  newDefaults={(rows) => ({ position: rows.reduce((m, r) => Math.max(m, Number(r.position)), 0) + 1 })}
                  sort={byPosition}
                />
              )}
              {tab === 'notas' && !childrenLoading && (
                <RowsSection
                  key={novel.id}
                  table="novel_notes"
                  novelId={String(novel.id)}
                  rows={notes}
                  setRows={setNotes}
                  fields={NOTE_FIELDS}
                  itemLabel="a nota"
                  newLabel="+ Nova nota"
                  emptyText="Nenhuma nota ainda."
                  title={(r) => String(r.title || 'Sem título')}
                  subtitle={(r) => String(r.kind)}
                  newDefaults={(rows) => ({ position: rows.reduce((m, r) => Math.max(m, Number(r.position)), 0) + 1 })}
                  sort={byPosition}
                />
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
