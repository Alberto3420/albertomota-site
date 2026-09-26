// Garante um player por vez: ao começar a tocar, pausa o que estava tocando antes.
let current: HTMLAudioElement | null = null

export function claimPlayback(audio: HTMLAudioElement) {
  if (current && current !== audio) current.pause()
  current = audio
}
