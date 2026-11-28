import { useEffect, useState } from 'react'
import { buildBookPdf, type BookData } from '../lib/bookPdf'

interface Props {
  /** Monta os dados do livro no momento do clique (sempre com o texto mais recente). */
  getBook: () => BookData
  fileName: string
  label?: string
}

export default function BookPdfButton({ getBook, fileName, label = 'Gerar PDF' }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setUrl(null)
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('keydown', close)
      URL.revokeObjectURL(url)
    }
  }, [url])

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      const blob = await buildBookPdf(getBook())
      setUrl(URL.createObjectURL(blob))
    } catch {
      setError('Não foi possível gerar o PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button onClick={() => void generate()} disabled={busy} className="header-cta disabled:opacity-60">
        {busy ? 'Gerando…' : label}
      </button>
      {error && <span className="ml-3 text-sm text-red-400">{error}</span>}
      {url && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 p-3 sm:p-6" role="dialog" aria-modal="true">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-white">
            <p className="font-semibold">Pré-visualização do PDF</p>
            <div className="flex gap-3">
              <a href={url} download={fileName} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-body">
                Baixar PDF
              </a>
              <button onClick={() => setUrl(null)} className="rounded-full border border-white/40 px-5 py-2 text-sm">
                Fechar
              </button>
            </div>
          </div>
          <iframe title="Pré-visualização do PDF" src={url} className="min-h-0 w-full flex-1 rounded-lg bg-white" />
        </div>
      )}
    </>
  )
}
