import { FormEvent, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Comment } from '../types/models'

const PREVIEW_COMMENTS: Comment[] = [
  ['Olga Koppen', 'Você canta com o coração e a alma. Merece todo sucesso. Deus te abençoe.'],
  ['Carlos Felipe', 'Essa música fala tudo sobre a minha vida, minha história. O meu coração chora e grita em silêncio, mas a vida continua e Deus está em nossos corações.'],
  ['Silva Nass', 'Misericórdia, onde você achou essa música? É lindíssima.'],
  ['Angelita Pereira Pereira', 'Obrigado por tudo que você fez por mim.'],
  ['Carlos Paulo Barcellos Farias', 'Canção diferente, fora da curva!'],
  ['Raimundo Castro', 'Linda maravilha musical, que faz nossos corações exigirem uma respiração mais profunda. Melodia que resgata nossos mais profundos sentimentos amorosos.'],
  ['@becamaria2020', 'Essa música é muito linda.'],
  ['@angelitagomes08', 'Encontrei a música da minha vida.'],
  ['@clena.queiroz', 'Muito linda essa música.'],
  ['@daniel.ardana0', 'Quem canta essa melodia faz bem ouvir, bem para o coração.'],
  ['@user2631012987880', 'Muito linda essa música.'],
  ['@lazaraborges777', 'Boa tarde, lindo demais.'],
].map(([display_name, body], index) => ({
  id: `preview-comment-${index + 1}`,
  composition_id: '',
  user_id: null,
  display_name,
  body,
  created_at: '',
}))

export default function CommentsSection() {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>(PREVIEW_COMMENTS)
  const [body, setBody] = useState('')
  const [name, setName] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!body.trim()) return

    const displayName = user ? profile?.display_name || 'Ouvinte' : name.trim()
    if (!displayName) {
      setError('Diga seu nome para comentar.')
      return
    }

    setSending(true)
    setComments((prev) => [
      {
        id: `local-comment-${Date.now()}`,
        composition_id: '',
        user_id: user?.id ?? null,
        display_name: displayName,
        body: body.trim(),
        created_at: new Date().toISOString(),
      },
      ...prev,
    ])
    setBody('')
    setSending(false)
  }

  return (
    <section id="comentarios" className="border-t border-white/10 bg-[#080d1d] py-20 text-white md:py-24">
      <div className="container-page">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            O que as canções despertaram
          </span>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-medium leading-tight text-white md:text-5xl">
            Quando uma história encontra <span className="text-gold">outra história.</span>
          </h2>
          <div className="mx-auto mt-6 h-1 w-20 bg-gold" aria-hidden="true" />
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60">
            Algumas músicas encontram as pessoas no momento exato. Estas são algumas das mensagens
            recebidas por Alberto Mota.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="flex min-h-[13rem] flex-col border border-[#3a4050] bg-[#171a25] p-7"
            >
              <p className="text-base font-semibold leading-7 text-white/95">“{comment.body}”</p>
              <p className="mt-auto pt-7 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">
                {comment.display_name}
              </p>
            </article>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-14 max-w-2xl space-y-3 border-t border-white/15 pt-8">
          <p className="text-sm font-semibold text-white">Deixe seu comentário</p>
          {!user && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full border border-white/15 bg-[#101627] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold"
            />
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Deixe seu comentário…"
            rows={3}
            className="w-full border border-white/15 bg-[#101627] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={sending} className="inline-flex items-center justify-center rounded-sm bg-gold px-6 py-3 text-sm font-bold text-body transition hover:bg-gold-light">
            {sending ? 'Enviando…' : 'Comentar'}
          </button>
        </form>
      </div>
    </section>
  )
}
