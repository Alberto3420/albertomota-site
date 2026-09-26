import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { href: '#inicio', label: 'Início' },
  { href: '#composicoes', label: 'Composições' },
  { href: '#comentarios', label: 'Comentários' },
  { href: '#sobre', label: 'Sobre' },
  { href: '#contato', label: 'Contato' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const { user, isAdmin, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy/95 text-white backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between">
        <a href="#inicio" className="text-base font-semibold tracking-tight">
          Alberto Mota - composições
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-white transition hover:text-gold-light"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user && !isAdmin && (
            <Link to="/dashboard" className="text-sm font-medium text-gold-light hover:underline">
              Meu painel
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-gold-light hover:underline">
              Painel admin
            </Link>
          )}
          {user ? (
            <button onClick={() => void signOut()} className="btn-secondary">
              Sair
            </button>
          ) : (
            <Link to="/login" className="header-cta">
              Entrar
            </Link>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center text-white lg:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-navy lg:hidden">
          <nav className="container-page flex flex-col gap-4 py-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white"
              >
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-gold-light">
                Painel admin
              </Link>
            )}
            {user && !isAdmin && (
              <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-gold-light">
                Meu painel
              </Link>
            )}
            {user ? (
              <button onClick={() => void signOut()} className="btn-secondary w-fit">
                Sair
              </button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="header-cta w-fit">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
