import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Activity } from '../types'
import type { WrappedData } from './wrapped'
import { ACTIVITY_OPTIONS } from './constants'
import { formatMinutesCompact } from './stats'
import shareText from './i18n/share'

// Card condivisibili come immagine (roadmap v2, pilastro 04): il layout è
// disegnato su canvas e passato alla Web Share API (o scaricato come
// fallback). Zero dipendenze nuove: niente html-to-image, solo fillText.
//
// I colori qui sono FISSI, non var(--red)/var(--zone-N): l'immagine vive
// fuori dall'app — in una chat, in una storia — dove i temi non esistono.
// È la stessa eccezione deliberata delle pagine pre-login: il vestito buono
// del brand, uguale per tutti.

const CARD_W = 1080
const CARD_H = 1350 // 4:5, il formato che Instagram e le chat non ritagliano
const MARGIN = 96
const BG = '#0D0D0D'
const ACCENT = '#F44352'
const TEXT = '#FFFFFF'
const MUTED = '#9CA3AF'
const FAINT = '#6B7280'
// Rispecchia --zone-1..4 di index.css (set scuro): la barra "spettro" è il
// motivo firma dell'app e deve essere riconoscibile anche nell'immagine.
const ZONE_HEX = ['#3B82F6', '#10B981', '#FBBF24', '#F44352']

export interface ShareStat {
  value: string
  label: string
}

export interface ShareCardData {
  kicker: string
  title: string
  subtitle: string
  stats: ShareStat[]
  footer: string
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// — Builder puri (testati in shareCard.test.ts): dai dati di dominio al
//   contenuto della card, senza toccare il DOM. —

export function buildActivityShareData(activity: Activity): ShareCardData {
  const label = ACTIVITY_OPTIONS.find((o) => o.value === activity.type)?.label ?? activity.type
  const stats: ShareStat[] = [
    { value: formatMinutesCompact(activity.duration_min), label: shareText.card.duration },
  ]
  if (activity.calories != null && activity.calories > 0) {
    stats.push({ value: `${activity.calories.toLocaleString('it-IT')} kcal`, label: shareText.card.calories })
  }
  if (activity.distance_km != null && activity.distance_km > 0) {
    stats.push({ value: `${activity.distance_km.toLocaleString('it-IT')} km`, label: shareText.card.distance })
  }
  return {
    kicker: shareText.card.activityKicker,
    title: label.toUpperCase(),
    subtitle: capitalize(format(parseISO(activity.date), 'EEEE d MMMM yyyy', { locale: it })),
    stats,
    footer: shareText.card.footer,
  }
}

export function buildWrappedShareData(w: WrappedData): ShareCardData {
  const stats: ShareStat[] = [
    { value: String(w.sessions), label: shareText.card.sessions },
    { value: formatMinutesCompact(w.minutes), label: shareText.card.time },
  ]
  if (w.calories > 0) stats.push({ value: `${w.calories.toLocaleString('it-IT')} kcal`, label: shareText.card.calories })
  if (w.km > 0) stats.push({ value: `${w.km.toLocaleString('it-IT')} km`, label: shareText.card.km })
  stats.push({ value: String(w.activeDays), label: shareText.card.activeDays })
  return {
    kicker: shareText.card.wrappedKicker,
    title: w.title.toUpperCase(),
    subtitle: shareText.card.wrappedSubtitle[w.period.kind],
    stats: stats.slice(0, 4),
    footer: shareText.card.footer,
  }
}

// — Da qui in giù si tocca il DOM: non coperto dai test (environment node). —

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
}

async function ensureFonts(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('96px "Bebas Neue"'),
      document.fonts.load('600 30px "Inter"'),
      document.fonts.load('400 34px "Inter"'),
    ])
  } catch {
    // Font non caricabili (es. offline): si disegna col fallback di sistema
  }
}

export async function renderShareCard(data: ShareCardData): Promise<HTMLCanvasElement> {
  await ensureFonts()
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non disponibile')

  // Fondo scuro + bagliore radiale dell'accento (l'eco di .hero-glow di Home)
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  const glow = ctx.createRadialGradient(CARD_W / 2, 180, 0, CARD_W / 2, 180, 900)
  glow.addColorStop(0, 'rgba(244, 67, 82, 0.16)')
  glow.addColorStop(1, 'rgba(244, 67, 82, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // Wordmark PISO/ZONE
  ctx.textBaseline = 'alphabetic'
  ctx.font = '64px "Bebas Neue", sans-serif'
  ctx.fillStyle = TEXT
  ctx.fillText('PISO', MARGIN, 172)
  ctx.fillStyle = ACCENT
  ctx.fillText('ZONE', MARGIN + ctx.measureText('PISO').width + 6, 172)

  // Kicker
  ctx.font = '600 30px "Inter", sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText(data.kicker.toUpperCase(), MARGIN, 305)

  // Titolo: Bebas grande, ridotto finché entra nella larghezza utile
  let titleSize = 150
  ctx.font = `${titleSize}px "Bebas Neue", sans-serif`
  while (titleSize > 60 && ctx.measureText(data.title).width > CARD_W - MARGIN * 2) {
    titleSize -= 10
    ctx.font = `${titleSize}px "Bebas Neue", sans-serif`
  }
  ctx.fillStyle = TEXT
  ctx.fillText(data.title, MARGIN, 462)

  // Sottotitolo
  ctx.font = '400 34px "Inter", sans-serif'
  ctx.fillStyle = MUTED
  ctx.fillText(data.subtitle, MARGIN, 528)

  // Barra "spettro Zone", il motivo firma dell'app
  const barW = CARD_W - MARGIN * 2
  const grad = ctx.createLinearGradient(MARGIN, 0, MARGIN + barW, 0)
  grad.addColorStop(0, ZONE_HEX[0])
  grad.addColorStop(0.4, ZONE_HEX[1])
  grad.addColorStop(0.7, ZONE_HEX[2])
  grad.addColorStop(1, ZONE_HEX[3])
  ctx.fillStyle = grad
  fillRoundedRect(ctx, MARGIN, 600, barW, 10, 5)

  // Statistiche in griglia a 2 colonne
  const colW = (CARD_W - MARGIN * 2) / 2
  data.stats.slice(0, 4).forEach((stat, i) => {
    const x = MARGIN + (i % 2) * colW
    const y = 790 + Math.floor(i / 2) * 235
    ctx.font = '96px "Bebas Neue", sans-serif'
    ctx.fillStyle = TEXT
    ctx.fillText(stat.value, x, y)
    ctx.font = '600 28px "Inter", sans-serif'
    ctx.fillStyle = MUTED
    ctx.fillText(stat.label.toUpperCase(), x, y + 48)
  })

  // Footer centrato
  ctx.font = '400 28px "Inter", sans-serif'
  ctx.fillStyle = FAINT
  ctx.textAlign = 'center'
  ctx.fillText(data.footer, CARD_W / 2, CARD_H - 72)
  ctx.textAlign = 'left'

  return canvas
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed'

// Genera l'immagine e la passa alla condivisione nativa; dove la Web Share
// API con file non c'è (desktop), ripiega sul download. 'cancelled' = l'utente
// ha chiuso il foglio di condivisione: non è un errore, niente toast.
export async function shareCardImage(data: ShareCardData, filename: string): Promise<ShareOutcome> {
  try {
    const canvas = await renderShareCard(data)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return 'failed'
    const file = new File([blob], filename, { type: 'image/png' })

    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return 'shared'
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return 'cancelled'
        // Condivisione fallita per altri motivi: si ripiega sul download
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return 'downloaded'
  } catch {
    return 'failed'
  }
}
