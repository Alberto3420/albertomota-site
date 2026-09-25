import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ConfirmDialog from './ConfirmDialog'
import MusicVersionCard from './MusicVersionCard'
import type { MusicPayment, MusicProject, MusicVersion } from '../types/models'

export type ProjectWithRelations = MusicProject & {
  music_versions: MusicVersion[]
  music_payments?: MusicPayment[]
}

const STATUS_LABELS: Record<MusicProject['status'], string> = {
  draft: 'Rascunho',
  payment_pending: 'Aguardando pagamento',
  queued: 'Na fila',
  generating: 'Gerando',
  ready: 'Pronta',
  failed: 'Falhou',
}

const BUCKET = 'musicas-geradas'

export default function MusicProjectItem({
  project,
  onChanged,
}: {
  project: ProjectWithRelations
  onChanged: () => void | Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const versions = [...(project.music_versions ?? [])].sort((a, b) => a.version_number - b.version_number)
  const pendingCheckout = project.music_payments?.[0]?.checkout_url
  // Um pedido aguardando pagamento tem cobrança aberta no Asaas: apagá-lo faria um pagamento futuro não gerar música.
  const canDelete = project.status !== 'payment_pending'

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove(versions.map((version) => `${project.user_id}/${version.id}.mp3`))
      if (storageError) throw storageError

      const { error } = await supabase.from('music_projects').delete().eq('id', project.id)
      if (error) throw error

      setConfirming(false)
      await onChanged()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      setDeleteError('Não foi possível excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-medium">{project.title}</h3>
          <p className="mt-1 text-sm text-paper/55">
            Criada em {new Date(project.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-paper/80">
            {STATUS_LABELS[project.status]}
          </span>
          {canDelete && (
            <button
              onClick={() => {
                setDeleteError(null)
                setConfirming(true)
              }}
              className="rounded-full border border-red-400/50 px-3 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
              aria-label={`Excluir ${project.title}`}
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      {versions.length > 0 && project.status !== 'payment_pending' && (
        <div className="mt-4 grid gap-4 border-t border-[#24457a] pt-4 sm:grid-cols-2">
          {versions.map((version) => <MusicVersionCard key={version.id} version={version} />)}
        </div>
      )}
      {project.status === 'generating' && (
        <p className="mt-3 text-sm text-paper/55">A Suno está preparando o áudio. Esta lista atualiza automaticamente.</p>
      )}
      {project.status === 'payment_pending' && (
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#24457a] pt-4">
          <p className="text-sm text-paper/60">A geração começa assim que o pagamento for confirmado.</p>
          {pendingCheckout && (
            <a href={pendingCheckout} target="_blank" rel="noreferrer" className="header-cta min-h-0 px-5 py-2">
              Pagar agora
            </a>
          )}
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title="Excluir esta música?"
          message={`"${project.title}" será apagada de forma permanente, com as duas versões e os áudios. Esta ação não pode ser desfeita.`}
          confirmLabel="Sim, excluir"
          busy={deleting}
          error={deleteError}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </article>
  )
}
