import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, user, isAdmin } = useAuth()

  if (loading) {
    return <div className="container-page py-24 text-center text-ink/60">Carregando…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-ink/60">
          Sua conta não tem permissão de administrador. Fale com Alberto se acha que isso é um
          engano.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
