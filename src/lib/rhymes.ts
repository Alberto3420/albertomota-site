// Rimas em português por regra (sem dicionário): é uma heurística, não substitui o ouvido.
export type RhymeKind = 'consoante' | 'toante' | 'nenhuma'

const VOWELS = 'aeiouáéíóúâêôãõà'
const ACCENTED = 'áéíóúâêôãõà'

function strip(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function lastWord(line: string): string {
  const words = line.toLowerCase().replace(/[^a-záéíóúâêôãõàç\s'-]/g, ' ').split(/\s+/).filter(Boolean)
  return (words[words.length - 1] ?? '').replace(/['-]/g, '')
}

// Devolve o "som final": da vogal tônica até o fim da palavra.
export function rhymeSound(rawWord: string): string {
  // O "u" mudo de que/qui/gue/gui não conta como vogal.
  const word = rawWord.toLowerCase().replace(/([qg])u(?=[eéêií])/g, '$1')
  const groups = [...word.matchAll(/[aeiouáéíóúâêôãõà]+/g)]
  if (groups.length === 0) return word

  let stressed = groups.length - 1
  let stressOnFirstVowel = false
  const accentedIndex = groups.findIndex((group) => [...group[0]].some((char) => ACCENTED.includes(char)))
  if (accentedIndex >= 0) stressed = accentedIndex
  else if (/^[iu][aeo]$/.test(groups[groups.length - 1][0]) && /[aeo]s?$/.test(word) && (groups[groups.length - 1].index ?? 0) + 2 >= word.length - 1) {
    // Final "ia/io/ua..." (alegria, rio, tua): a tônica é o i/u.
    stressed = groups.length - 1
    stressOnFirstVowel = true
  } else if (groups.length > 1 && /(a|e|o|as|es|os|am|em|ens)$/.test(word)) stressed = groups.length - 2

  const group = groups[stressed]
  const text = group[0]
  let offset = [...text].findIndex((char) => ACCENTED.includes(char))
  if (offset < 0) offset = !stressOnFirstVowel && text.length > 1 && /^[iu][aeo]/.test(strip(text)) ? 1 : 0
  return word.slice((group.index ?? 0) + offset)
}

function vowelsOf(sound: string) {
  const base = strip(sound).replace(/[^aeiou]/g, '')
  // Depois da tônica, e≈i e o≈u na pronúncia.
  return base[0] + base.slice(1).replace(/e/g, 'i').replace(/o/g, 'u')
}

export function compareRhyme(first: string, second: string): { kind: RhymeKind; soundA: string; soundB: string; same: boolean } {
  const a = first.trim().toLowerCase()
  const b = second.trim().toLowerCase()
  const soundA = rhymeSound(a)
  const soundB = rhymeSound(b)
  if (!a || !b || !soundA || !soundB) return { kind: 'nenhuma', soundA, soundB, same: false }
  const same = a === b
  if (strip(soundA) === strip(soundB)) return { kind: 'consoante', soundA, soundB, same }
  if (vowelsOf(soundA) === vowelsOf(soundB)) return { kind: 'toante', soundA, soundB, same }
  return { kind: 'nenhuma', soundA, soundB, same }
}

export interface SchemeLine {
  text: string
  word: string
  label: string
}

// Esquema de rimas por estrofe (linhas em branco ou marcadores [..] reiniciam as letras).
export function rhymeScheme(lyrics: string): { stanzas: SchemeLine[][] } {
  const stanzas: SchemeLine[][] = []
  let current: SchemeLine[] = []
  let groups: { word: string; letter: string }[] = []

  const flush = () => {
    if (current.length > 0) stanzas.push(current)
    current = []
    groups = []
  }

  for (const line of lyrics.split('\n')) {
    if (!line.trim() || /^\s*\[[^\]]*\]\s*$/.test(line)) {
      flush()
      continue
    }
    const word = lastWord(line)
    let label = ''
    if (word) {
      const consoante = groups.find((group) => compareRhyme(group.word, word).kind === 'consoante')
      const toante = groups.find((group) => compareRhyme(group.word, word).kind === 'toante')
      if (consoante) label = consoante.letter
      else if (toante) label = `${toante.letter}′`
      else {
        const letter = String.fromCharCode(65 + groups.length)
        groups.push({ word, letter })
        label = letter
      }
    }
    current.push({ text: line.trim(), word, label })
  }
  flush()
  return { stanzas }
}
