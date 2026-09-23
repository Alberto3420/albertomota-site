import type { Composition } from '../types/models'
import AudioPlayer from './AudioPlayer'

export default function CompositionCard({
  composition,
  index,
}: {
  composition: Composition
  index: number
}) {
  return (
    <div
      className={`grid gap-4 px-4 py-5 transition-colors hover:bg-white/[0.04] md:grid-cols-[3rem_5rem_minmax(0,1fr)_13rem] md:items-center md:px-4 ${
        composition.is_featured ? 'border-l-4 border-gold bg-white/[0.06]' : ''
      }`}
    >
      <span className="text-xl font-semibold text-gold">{String(index + 1).padStart(2, '0')}</span>
      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-[#26302d]">
          {composition.cover_url && (
            <img
              src={composition.cover_url}
              alt={composition.title}
              className="h-full w-full object-cover"
            />
          )}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold">{composition.title}</h3>
        {composition.short_description && (
          <p className="mt-1 line-clamp-2 text-sm text-paper/70">{composition.short_description}</p>
        )}
      </div>
      <div className="flex items-center justify-start gap-4 md:justify-end">
        {composition.is_featured && (
          <span className="hidden border border-gold/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold lg:inline-block">
            Composição em destaque
          </span>
        )}
        <AudioPlayer src={composition.audio_url} title={composition.title} />
      </div>
    </div>
  )
}
