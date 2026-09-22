import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

function guessFileType(file: File): 'image' | 'audio' | 'video' | 'other' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  return 'other'
}

export default function FanUploadSection() {
  const { user, profile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!user) {
    return (
      <section id="envie-sua-mensagem" className="border-t border-ink/10 py-16">
        <div className="container-page max-w-xl text-center">
          <span className="section-label">Espaço dos fãs</span>
          <h2 className="mt-2 text-2xl font-semibold">Envie sua foto, cover ou áudio</h2>
          <p className="mt-2 text-ink/60">
            Entre com sua conta para enviar uma mídia para o mural de fãs.
          </p>
          <a href="/login" className="btn-primary mt-4 inline-flex">
            Entrar para enviar
          </a>
        </div>
      </section>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file || !user) return
    setSending(true)
    setStatus('idle')
    setErrorMsg(null)

    try {
      const fileExt = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('fan-uploads')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage.from('fan-uploads').getPublicUrl(path)

      const { error: insertError } = await supabase.from('fan_submissions').insert({
        user_id: user.id,
        display_name: profile?.display_name || 'Fã',
        message: message.trim() || null,
        file_url: publicUrl.publicUrl,
        file_type: guessFileType(file),
        status: 'pending',
      })
      if (insertError) throw insertError

      setStatus('success')
      setFile(null)
      setMessage('')
    } catch {
      setStatus('error')
      setErrorMsg('Não foi possível enviar. Tente novamente em instantes.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="envie-sua-mensagem" className="border-t border-ink/10 py-16">
      <div className="container-page max-w-xl">
        <span className="section-label">Espaço dos fãs</span>
        <h2 className="mt-2 text-2xl font-semibold">Envie sua foto, cover ou áudio</h2>
        <p className="mt-2 text-sm text-ink/60">
          Seu envio passa por uma aprovação antes de aparecer publicamente.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="file"
            accept="image/*,audio/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Conte um pouco sobre o que está enviando (opcional)"
            rows={2}
            className="w-full rounded-xl border border-ink/15 bg-paper px-4 py-2.5 text-sm outline-none focus:border-clay"
          />
          {status === 'success' && (
            <p className="text-sm text-moss">Recebido! Obrigado por compartilhar. 🎶</p>
          )}
          {status === 'error' && errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          <button type="submit" disabled={!file || sending} className="btn-primary">
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </div>
    </section>
  )
}
