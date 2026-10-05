import { useRef } from 'react'
import { countLineSyllables } from '../lib/syllables'

const MARKERS: { label: string; tag: string }[] = [
  { label: 'Intro', tag: '[Intro]' },
  { label: 'Verso', tag: '[Verse]' },
  { label: 'Pré-refrão', tag: '[Pre-Chorus]' },
  { label: 'Refrão', tag: '[Chorus]' },
  { label: 'Ponte', tag: '[Bridge]' },
  { label: 'Final', tag: '[Outro]' },
]

const LINE_HEIGHT = 24

interface LyricsEditorProps {
  id: string
  value: string
  onChange: (value: string) => void
}

export default function LyricsEditor({ id, value, onChange }: LyricsEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const lines = value.split('\n')

  // Insere o marcador numa linha própria, na posição do cursor.
  function insertMarker(tag: string) {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const before = value.slice(0, start)
    const after = value.slice(end)
    const prefix = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
    const insertion = `${prefix}${tag}\n`
    onChange(before + insertion + after)
    const caret = before.length + insertion.length
    requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(caret, caret)
    })
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-paper/50">Inserir:</span>
        {MARKERS.map((marker) => (
          <button
            key={marker.tag}
            type="button"
            onClick={() => insertMarker(marker.tag)}
            title={marker.tag}
            className="rounded-full border border-[#24457a] px-3 py-1 text-xs text-paper/80 transition hover:border-gold hover:text-gold"
          >
            {marker.label}
          </button>
        ))}
      </div>
      <div className="flex overflow-hidden rounded-xl border border-[#24457a] bg-[#0a1a33] focus-within:border-gold">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-10 shrink-0 select-none overflow-hidden border-r border-[#24457a] bg-[#0f2547]/60 py-3 text-right text-xs text-gold/80"
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
        >
          {lines.map((line, index) => {
            const count = countLineSyllables(line)
            return (
              <div key={index} className="pr-2" style={{ height: LINE_HEIGHT }}>
                {count ?? ''}
              </div>
            )
          })}
        </div>
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop
          }}
          wrap="off"
          rows={20}
          className="min-w-0 flex-1 resize-y whitespace-pre bg-transparent px-4 py-3 text-sm text-paper outline-none placeholder:text-paper/35"
          style={{ lineHeight: `${LINE_HEIGHT}px` }}
          placeholder="Escreva a letra aqui. O número à esquerda é a contagem aproximada de sílabas de cada verso."
        />
      </div>
      <p className="mt-1 text-xs text-paper/40">Contagem estimada de sílabas poéticas (com elisão); pode variar um pouco na pronúncia real.</p>
    </div>
  )
}
