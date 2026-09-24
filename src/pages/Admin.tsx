import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { Composition, FanSubmission } from '../types/models'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function Admin() {
  const { signOut } = useAuth()
  const [compositions, setCompositions] = useState<Composition[]>([])
  const [submissions, setSubmissions] = useState<FanSubmission[]>([])
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [story, setStory] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const [{ data: comps }, { data: subs }] = await Promise.all([
      supabase.from('compositions').select('*').order('position', { ascending: true }),
      supabase
        .from('fan_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    setCompositions((comps as Composition[]) ?? [])
    setSubmissions((subs as FanSubmission[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!title.trim()) {
      setFormError('Dê um título à composição.')
      return
    }

    setSaving(true)
    try {
      let coverUrl: string | null = null
      let audioUrl: string | null = null
      const slug = slugify(title) || `composicao-${Date.now()}`

      if (coverFile) {
        const path = `${slug}-${Date.now()}.${coverFile.name.split('.').pop()}`
        const { error } = await supabase.storage.from('covers').upload(path, coverFile)
        if (error) throw error
        coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
      }

      if (audioFile) {
        const path = `${slug}-${Date.now()}.${audioFile.name.split('.').pop()}`
        const { error } = await supabase.storage.from('audio').upload(path, audioFile)
        if (error) throw error
        audioUrl = supabase.storage.from('audio').getPublicUrl(path).data.publicUrl
      }

      const { error: insertError } = await supabase.from('compositions').insert({
        slug,
        title: title.trim(),
        short_description: shortDescription.trim() || null,
        story: story.trim() || null,
        lyrics: lyrics.trim() || null,
        cover_url: coverUrl,
        audio_url: audioUrl,
        position: compositions.length,
        is_featured: isFeatured,
      })
      if (insertError) throw insertError

      setTitle('')
      setShortDescription('')
      setStory('')
      setLyrics('')
      setIsFeatured(false)
      setCoverFile(null)
      setAudioFile(null)
      await loadData()
    } catch (err) {
      setFormError('Não foi possível salvar. Verifique os dados e tente novamente.')
      // eslint-disable-next-line no-console
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta composição?')) return
    await supabase.from('compositions').delete().eq('id', id)
    await loadData()
  }

  async function handleModerate(id: string, status: 'approved' | 'rejected') {
    await supabase.from('fan_submissions').update({ status }).eq('id', id)
    await loadData()
  }

  return (
    <div className="min-h-screen bg-[#111817] text-paper">
    <div className="container-page max-w-5xl py-12">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-paper/50 hover:underline">
            ← Voltar ao site
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">Painel administrativo</h1>
        </div>
        <button onClick={() => void signOut()} className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:border-white">
          Sair
        </button>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Nova composição</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 rounded-2xl border border-[#24457a] bg-[#0f2547] p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-2.5 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Descrição curta</label>
            <input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-2.5 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">História relacionada (opcional)</label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={5}
              placeholder="Conte a vivência, a inspiração ou o momento ligado a esta canção."
              className="mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-2.5 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Letra (opcional)</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-[#24457a] bg-[#0a1a33] px-4 py-2.5 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Capa (imagem)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Áudio</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Marcar como destaque
          </label>

          {formError && <p className="text-sm text-red-400 md:col-span-2">{formError}</p>}

          <button type="submit" disabled={saving} className="header-cta w-fit disabled:opacity-60 md:col-span-2">
            {saving ? 'Salvando…' : 'Adicionar composição'}
          </button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Composições cadastradas</h2>
        {loading ? (
          <p className="mt-4 text-paper/50">Carregando…</p>
        ) : (
          <div className="mt-4 divide-y divide-[#24457a] overflow-hidden rounded-2xl border border-[#24457a] bg-[#0f2547]">
            {compositions.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{comp.title}</p>
                  <p className="truncate text-sm text-paper/50">{comp.short_description}</p>
                </div>
                <button
                  onClick={() => void handleDelete(comp.id)}
                  className="shrink-0 text-sm font-medium text-red-400 hover:underline"
                >
                  Excluir
                </button>
              </div>
            ))}
            {compositions.length === 0 && (
              <p className="p-4 text-sm text-paper/50">Nenhuma composição ainda.</p>
            )}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Envios de fãs pendentes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {submissions.map((sub) => (
            <div key={sub.id} className="rounded-2xl border border-[#24457a] bg-[#0f2547] p-4">
              <p className="text-sm font-semibold">{sub.display_name}</p>
              {sub.message && <p className="mt-1 text-sm text-paper/60">{sub.message}</p>}
              <a
                href={sub.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block truncate text-sm text-gold-light hover:underline"
              >
                Ver arquivo ({sub.file_type})
              </a>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => void handleModerate(sub.id, 'approved')}
                  className="rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-body transition hover:bg-gold-light"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => void handleModerate(sub.id, 'rejected')}
                  className="rounded-full border border-white/30 px-4 py-1.5 text-xs font-medium transition hover:border-white"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <p className="text-sm text-paper/50">Nenhum envio pendente.</p>
          )}
        </div>
      </section>
    </div>
    </div>
  )
}
