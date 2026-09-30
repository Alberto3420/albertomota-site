import type { Composition } from '../types/models'
import AudioPlayer from './AudioPlayer'

export default function CompositionCard({ composition }: { composition: Composition }) {
  return (
    <div
      className={`px-4 py-5 transition-colors hover:bg-white/[0.04] ${
        composition.is_featured ? 'border-l-4 border-gold bg-white/[0.06]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="min-w-0 text-xl font-semibold text-gold">{composition.title}</h3>
        <div className="flex shrink-0 items-center gap-4">
          {composition.is_featured && (
            <span className="hidden border border-gold/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold lg:inline-block">
              Composição em destaque
            </span>
          )}
          <AudioPlayer src={composition.audio_url} title={composition.title} />
        </div>
      </div>
      <div className="mt-3 flex items-start gap-4">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-[#26302d]">
          {composition.cover_url && (
            <img
              src={composition.cover_url}
              alt={composition.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        {composition.short_description && (
          <p className="line-clamp-3 min-w-0 flex-1 text-sm text-paper/70">
            {composition.short_description}
          </p>
        )}
      </div>
    </div>
  )
}
