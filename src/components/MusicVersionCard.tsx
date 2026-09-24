import type { MusicVersion } from '../types/models'

function formatDuration(seconds: number) {
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function MusicVersionCard({ version }: { version: MusicVersion }) {
  return (
    <div className="rounded-xl border border-[#24457a] bg-[#0a1a33] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-paper/45">
        Versão {version.version_number}
        {version.duration ? ` · ${formatDuration(version.duration)}` : ''}
      </p>
      {version.audio_url ? (
        <>
          <audio controls className="mt-3 w-full" src={version.audio_url} />
          {version.lyrics && (
            <details className="mt-3 rounded-lg border border-[#24457a] bg-[#0f2547]">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-gold-light">
                Abrir letra
              </summary>
              <p className="whitespace-pre-line border-t border-[#24457a] px-3 py-3 text-sm text-paper/80">
                {version.lyrics}
              </p>
            </details>
          )}
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
    </div>
  )
}
