import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth()

  if (loading) {
    return <div className="container-page py-24 text-center text-ink/60">Carregando…</div>
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}
