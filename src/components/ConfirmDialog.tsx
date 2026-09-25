import { useEffect } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [busy, onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-md rounded-2xl border border-[#24457a] bg-[#0f2547] p-6 text-paper shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-xl font-semibold">{title}</h2>
        <p id="confirm-message" className="mt-3 text-sm text-paper/75">{message}</p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            autoFocus
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium transition hover:border-white disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
          >
            {busy ? 'Excluindo…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
