// Gera o PDF (capa, folha de rosto, sumário, prólogo e capítulos/obras) de um romance ou de contos.
// jsPDF é carregado sob demanda para não pesar no resto do painel.

export interface BookSection {
  /** Ex.: "Capítulo 3" — vazio para prólogo e contos. */
  label?: string
  title: string
  text: string
}

export interface BookData {
  title: string
  subtitle?: string
  author?: string
  coverUrl?: string
  /** Texto exibido na folha de rosto logo abaixo do título (ex.: "Contos e Crônicas"). */
  kindLabel?: string
  sections: BookSection[]
}

const W = 148 // A5
const H = 210
const M = { top: 22, bottom: 22, side: 20 }
const FONT = 'times'

function loadImage(url: string): Promise<{ data: string; w: number; h: number; fmt: 'JPEG' | 'PNG' } | null> {
  return fetch(url)
    .then((r) => (r.ok ? r.blob() : Promise.reject()))
    .then(
      (blob) =>
        new Promise<{ data: string; w: number; h: number; fmt: 'JPEG' | 'PNG' } | null>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const data = String(reader.result)
            const img = new Image()
            img.onload = () => resolve({ data, w: img.naturalWidth, h: img.naturalHeight, fmt: blob.type.includes('png') ? 'PNG' : 'JPEG' })
            img.onerror = () => resolve(null)
            img.src = data
          }
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(blob)
        }),
    )
    .catch(() => null)
}

export async function buildBookPdf(book: BookData): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: [W, H] })
  const textWidth = W - M.side * 2
  const lineH = 5.6
  doc.setLanguage('pt-BR')

  // ---- Capa
  const cover = book.coverUrl ? await loadImage(book.coverUrl) : null
  if (cover) {
    const scale = Math.max(W / cover.w, H / cover.h) // preenche a página (cortando o excesso)
    const iw = cover.w * scale
    const ih = cover.h * scale
    doc.addImage(cover.data, cover.fmt, (W - iw) / 2, (H - ih) / 2, iw, ih)
  } else {
    doc.setFillColor(15, 37, 71)
    doc.rect(0, 0, W, H, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont(FONT, 'bold')
    doc.setFontSize(26)
    const lines = doc.splitTextToSize(book.title || 'Sem título', textWidth) as string[]
    doc.text(lines, W / 2, 80, { align: 'center' })
    if (book.subtitle) {
      doc.setFont(FONT, 'italic')
      doc.setFontSize(13)
      doc.text(doc.splitTextToSize(book.subtitle, textWidth) as string[], W / 2, 80 + lines.length * 11 + 4, { align: 'center' })
    }
    if (book.author) {
      doc.setFont(FONT, 'normal')
      doc.setFontSize(13)
      doc.text(book.author, W / 2, H - 28, { align: 'center' })
    }
  }

  // ---- Folha de rosto
  doc.addPage()
  doc.setTextColor(30, 30, 30)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(24)
  const tl = doc.splitTextToSize(book.title || 'Sem título', textWidth) as string[]
  doc.text(tl, W / 2, 75, { align: 'center' })
  let y = 75 + tl.length * 10 + 4
  if (book.subtitle) {
    doc.setFont(FONT, 'italic')
    doc.setFontSize(13)
    const sl = doc.splitTextToSize(book.subtitle, textWidth) as string[]
    doc.text(sl, W / 2, y, { align: 'center' })
    y += sl.length * 6 + 4
  }
  if (book.kindLabel) {
    doc.setFont(FONT, 'normal')
    doc.setFontSize(11)
    doc.text(book.kindLabel, W / 2, y + 4, { align: 'center' })
  }
  if (book.author) {
    doc.setFont(FONT, 'normal')
    doc.setFontSize(14)
    doc.text(book.author, W / 2, H - 40, { align: 'center' })
  }

  // ---- Seções (conteúdo); guarda a página inicial de cada uma para o sumário
  const startPages: number[] = []
  const tocPage = doc.getNumberOfPages() + 1
  doc.addPage() // página reservada ao sumário (pode ocupar só 1 página)

  for (const s of book.sections) {
    doc.addPage()
    startPages.push(doc.getNumberOfPages())
    let cy = M.top + 14
    doc.setTextColor(30, 30, 30)
    if (s.label) {
      doc.setFont(FONT, 'normal')
      doc.setFontSize(11)
      doc.text(s.label.toUpperCase(), W / 2, cy, { align: 'center', charSpace: 1 })
      cy += 8
    }
    doc.setFont(FONT, 'bold')
    doc.setFontSize(17)
    const hl = doc.splitTextToSize(s.title || 'Sem título', textWidth) as string[]
    doc.text(hl, W / 2, cy, { align: 'center' })
    cy += hl.length * 8 + 8

    doc.setFont(FONT, 'normal')
    doc.setFontSize(11.5)
    const paragraphs = (s.text || '').replace(/\r\n/g, '\n').split(/\n+/).map((p) => p.trim()).filter(Boolean)
    if (paragraphs.length === 0) {
      doc.setFont(FONT, 'italic')
      doc.text('(ainda sem texto)', W / 2, cy, { align: 'center' })
    }
    for (const p of paragraphs) {
      const isBreak = /^[*\-–—_# ]{1,10}$/.test(p)
      const lines = doc.splitTextToSize(p, textWidth - (isBreak ? 0 : 0)) as string[]
      lines.forEach((ln, i) => {
        if (cy > H - M.bottom) {
          doc.addPage()
          cy = M.top
        }
        const indent = i === 0 && !isBreak ? 6 : 0
        if (isBreak) doc.text(ln, W / 2, cy, { align: 'center' })
        else doc.text(ln, M.side + indent, cy)
        cy += lineH
      })
      cy += 1.2
    }
  }

  // ---- Sumário
  doc.setPage(tocPage)
  doc.setTextColor(30, 30, 30)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(17)
  doc.text('Sumário', W / 2, M.top + 14, { align: 'center' })
  doc.setFont(FONT, 'normal')
  doc.setFontSize(11)
  let ty = M.top + 28
  book.sections.forEach((s, i) => {
    if (ty > H - M.bottom) return
    const name = [s.label, s.title].filter(Boolean).join(' — ') || 'Sem título'
    const shown = (doc.splitTextToSize(name, textWidth - 14) as string[])[0]
    doc.text(shown, M.side, ty)
    doc.text(String(startPages[i]), W - M.side, ty, { align: 'right' })
    ty += 7
  })

  // ---- Numeração (não na capa, folha de rosto e sumário)
  const total = doc.getNumberOfPages()
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(110, 110, 110)
  for (let p = tocPage + 1; p <= total; p++) {
    doc.setPage(p)
    doc.text(String(p), W / 2, H - 12, { align: 'center' })
  }

  return doc.output('blob')
}
