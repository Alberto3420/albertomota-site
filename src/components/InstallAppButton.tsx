import { useEffect, useState } from 'react'

type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** Botão "Instalar app". Esconde se já estiver instalado. */
export default function InstallAppButton({ className = '' }: { className?: string }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [hint, setHint] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as InstallEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  async function install() {
    if (evt) {
      await evt.prompt()
      const { outcome } = await evt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setEvt(null)
    } else {
      setHint((v) => !v)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={() => void install()} className={className}>
        Instalar app
      </button>
      {hint && (
        <span className="max-w-xs text-xs text-white/80">
          {isIos()
            ? 'No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início".'
            : 'Use o menu do navegador (⋮) e escolha "Instalar app" ou "Adicionar à tela inicial".'}
        </span>
      )}
    </div>
  )
}
