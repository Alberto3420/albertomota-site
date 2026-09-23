import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { href: '#inicio', label: 'Início' },
  { href: '#metodo', label: 'Método' },
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
            <a href="#composicoes" className="header-cta">
              Ouvir composições
            </a>
          )}
          {user && !isAdmin && (
            <Link to="/login" className="header-cta">
              Ouvir composições
            </Link>
          )}
        </div>

        <button
          className="text-2xl text-white lg:hidden"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
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
              <a href="#composicoes" onClick={() => setOpen(false)} className="header-cta w-fit">
                Ouvir composições
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
