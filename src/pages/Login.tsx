import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signInWithPassword, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    const result =
      mode === 'signin'
        ? await signInWithPassword(email, password)
        : await signUp(email, password, displayName)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (mode === 'signup') {
      setInfo('Conta criada! Verifique seu e-mail para confirmar o cadastro, depois faça login.')
      setMode('signin')
      return
    }

    navigate('/')
  }

  return (
    <div className="container-page flex min-h-screen max-w-md flex-col justify-center py-16">
      <Link to="/" className="mb-8 font-serif text-lg font-semibold">
        Alberto Mota
      </Link>

      <h1 className="text-2xl font-semibold">
        {mode === 'signin' ? 'Entrar' : 'Criar conta'}
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        {mode === 'signin'
          ? 'Entre para comentar, curtir e enviar sua mídia.'
          : 'Crie sua conta para participar da comunidade.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="text-sm font-medium">Nome</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-clay"
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-clay"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border border-ink/15 px-4 py-2.5 text-sm outline-none focus:border-clay"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-moss">{info}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="mt-6 text-sm text-clay hover:underline"
      >
        {mode === 'signin' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
      </button>
    </div>
  )
}
