import CopyButton from './CopyButton'
import type { MusicVersion } from '../types/models'

function formatDuration(seconds: number) {
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function MusicVersionCard({ version }: { version: MusicVersion }) {
  const hasText = !!(version.melody || version.lyrics)
  const both = `MELODIA:\n${version.melody ?? ''}\n\nLETRA:\n${version.lyrics ?? ''}`

  return (
    <div className="rounded-xl border border-[#24457a] bg-[#0a1a33] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-paper/45">
        Versão {version.version_number}
        {version.duration ? ` · ${formatDuration(version.duration)}` : ''}
      </p>
      {version.audio_url ? (
        <>
          <audio controls className="mt-3 w-full" src={version.audio_url} />
          <a
            href={version.audio_url}
            target="_blank"
            rel="noreferrer"
            download
            className="mt-3 inline-flex text-sm font-semibold text-gold-light hover:underline"
          >
            Abrir ou baixar áudio
          </a>
        </>
      ) : version.status === 'failed' ? (
        <p className="mt-3 text-sm text-red-400">{version.error_message ?? 'Falha na geração.'}</p>
      ) : (
        <p className="mt-3 text-sm text-paper/55">Gerando áudio…</p>
      )}

      {hasText && (
        <details className="mt-3 rounded-lg border border-[#24457a] bg-[#0f2547]">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-gold-light">
            Abrir letra e melodia
          </summary>
          <div className="space-y-4 border-t border-[#24457a] px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-paper/50">Copiar melodia e letra juntas</span>
              <CopyButton text={both} label="Copiar melodia e letra" />
            </div>
            {version.melody && (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-paper/60">Melodia</h4>
                  <CopyButton text={version.melody} label="Copiar melodia" />
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-paper/80">{version.melody}</p>
              </div>
            )}
            {version.lyrics && (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-paper/60">Letra</h4>
                  <CopyButton text={version.lyrics} label="Copiar letra" />
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-paper/80">{version.lyrics}</p>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
