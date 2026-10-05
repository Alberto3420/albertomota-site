// Contagem aproximada de sílabas poéticas em português (heurística, não é exata).
const VOWELS = 'aeiouáéíóúâêôãõàü'
const GROUP = /[aeiouáéíóúâêôãõàü]+/g

function isVowel(char: string | undefined) {
  return !!char && VOWELS.includes(char)
}

function cleanWord(word: string) {
  return word.toLowerCase().replace(/[^a-záéíóúâêôãõàüç]/g, '')
}

export function isMarkerLine(line: string) {
  return /^\s*\[[^\]]*\]\s*$/.test(line)
}

// Retorna null para linhas vazias ou marcadores de estrutura, como [Refrão].
export function countLineSyllables(line: string): number | null {
  if (!line.trim() || isMarkerLine(line)) return null
  const words = line.split(/\s+/).map(cleanWord).filter(Boolean)
  if (words.length === 0) return null

  let total = 0
  words.forEach((word, index) => {
    total += word.match(GROUP)?.length ?? 0
    // Elisão: vogal final + vogal inicial da palavra seguinte formam uma só sílaba.
    const next = words[index + 1]
    if (next && isVowel(word[word.length - 1]) && isVowel(next.replace(/^h/, '')[0])) total -= 1
  })
  return Math.max(total, 1)
}
