// PisoZone — intro "olimpica": gli atleti sfilano sulla riga rossa, che poi
// si contrae e diventa il logo classico (PISO bianco + ZONE rosso, linea
// spettro Zone, tagline). 1080×1080 @30fps, ~13s, frame SVG → PNG via sharp.
const fs = require('fs')
const path = require('path')
const opentype = require('opentype.js')
const sharp = require('c:/Users/m.pisati/Desktop/Progetti personali/PisoZone App/node_modules/sharp')
const athletes = require('./athletes')

const W = 1080, H = 1080, FPS = 30, DURATION = 13.0
const FRAMES = Math.round(DURATION * FPS)

const BG = '#0D0D0D'
const RED = '#F44352'
const ZONES = ['#3B82F6', '#10B981', '#FBBF24', '#F44352']

const LINE_Y = 610          // centro verticale della linea
const LINE_H = 6
const LOGO_LINE_W = 430     // larghezza finale sotto il wordmark
const SCALE = 3.4           // atleti ~163px
const SPEED = 420           // px/s della sfilata
const ENTER_EVERY = 0.7     // distacco tra un atleta e il successivo

// ── Timeline (secondi) ──
const T_LINE_IN = [0.0, 0.8]      // la linea si disegna dal centro
const T_PARADE_START = 0.9
const T_CONTRACT = [8.0, 8.9]     // la linea si contrae verso il logo
const T_WORDMARK = [8.9, 9.35]    // PISOZONE appare (impatto audio)
const T_TAGLINE = [9.8, 10.45]    // le 3 parole sotto

// ── Easing ──
const clamp01 = (x) => Math.max(0, Math.min(1, x))
const prog = (t, [a, b]) => clamp01((t - a) / (b - a))
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3)
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

// ── Tipografia → tracciati (Bebas/Inter non sono installati a sistema) ──
const bebas = opentype.parse(fs.readFileSync(path.join(__dirname, 'BebasNeue-Regular.ttf')))
const inter = opentype.parse(fs.readFileSync(path.join(__dirname, 'Inter-Regular.ttf')))
// Le lookup GSUB di Inter non sono tutte supportate da opentype.js e il
// tagline è solo maiuscole+punto mediano: niente legature, tabella via.
delete inter.tables.gsub

const WM_SIZE = 190
const WM_LS = 0.1 // letterSpacing 0.1em come nello splash
const wPiso = bebas.getAdvanceWidth('PISO', WM_SIZE, { letterSpacing: WM_LS, kerning: true })
const wZone = bebas.getAdvanceWidth('ZONE', WM_SIZE, { letterSpacing: WM_LS, kerning: true })
const wmX = (W - (wPiso + wZone)) / 2
const WM_BASE = 566
const pisoPath = bebas.getPath('PISO', wmX, WM_BASE, WM_SIZE, { letterSpacing: WM_LS, kerning: true }).toPathData(2)
const zonePath = bebas.getPath('ZONE', wmX + wPiso, WM_BASE, WM_SIZE, { letterSpacing: WM_LS, kerning: true }).toPathData(2)

const TAG_TEXT = 'ALLENATI · CRESCI · DOMINA'
const TAG_SIZE = 30
const TAG_LS = 0.3
const wTag = inter.getAdvanceWidth(TAG_TEXT, TAG_SIZE, { letterSpacing: TAG_LS, kerning: true })
const tagPath = inter
  .getPath(TAG_TEXT, (W - wTag) / 2, 668, TAG_SIZE, { letterSpacing: TAG_LS, kerning: true })
  .toPathData(2)

// ── Composizione di un frame ──
function frameSvg(t) {
  const parts = []

  // Linea: piena larghezza durante la sfilata, poi si contrae al logo e il
  // rosso sfuma nello spettro Zone (il motivo firma dell'app).
  const drawP = easeOutCubic(prog(t, T_LINE_IN))
  const contractP = easeInOutCubic(prog(t, T_CONTRACT))
  const lineW = (W * drawP) * (1 - contractP) + LOGO_LINE_W * contractP
  const lineX = (W - lineW) / 2
  const mix = contractP // 0 = rossa, 1 = spettro

  if (lineW > 2) {
    // bagliore morbido dietro la linea (pulsa leggermente nel finale)
    const pulse = t > 10.5 ? 0.5 + 0.16 * Math.sin((t - 10.5) * 2.2) : 0.5
    parts.push(`<rect x="${lineX}" y="${LINE_Y - LINE_H / 2}" width="${lineW}" height="${LINE_H}" rx="${LINE_H / 2}" fill="${RED}" filter="url(#soft)" opacity="${(0.55 * (1 - mix) + pulse * mix).toFixed(3)}"/>`)
    if (mix < 1) parts.push(`<rect x="${lineX}" y="${LINE_Y - LINE_H / 2}" width="${lineW}" height="${LINE_H}" rx="${LINE_H / 2}" fill="${RED}" opacity="${(1 - mix).toFixed(3)}"/>`)
    if (mix > 0) parts.push(`<rect x="${lineX}" y="${LINE_Y - LINE_H / 2}" width="${lineW}" height="${LINE_H}" rx="${LINE_H / 2}" fill="url(#spectrum)" opacity="${mix.toFixed(3)}"/>`)
  }

  // Sfilata: gli atleti attraversano lo schermo sulla linea, con passo e
  // rimbalzo propri; spariscono prima che la linea si contragga.
  if (t < T_CONTRACT[0]) {
    athletes.forEach((a, i) => {
      const t0 = T_PARADE_START + i * ENTER_EVERY
      if (t < t0) return
      const x = -200 + SPEED * (t - t0)
      if (x > W + 60) return
      const phase = (t * 2.6 + i * 0.37) % 1
      const bobPx = Math.sin(phase * Math.PI * 2) * a.bob * SCALE
      const ty = LINE_Y - a.groundY * SCALE + bobPx
      parts.push(`<g transform="translate(${x.toFixed(1)},${ty.toFixed(1)}) scale(${SCALE})" stroke="#FFFFFF" color="#FFFFFF">${a.draw(phase)}</g>`)
    })
  }

  // Wordmark: PISO bianco + ZONE rosso col suo glow, come lo splash
  const wmP = easeOutCubic(prog(t, T_WORDMARK))
  if (wmP > 0) {
    const dy = (1 - wmP) * 26
    const s = 1.045 - 0.045 * wmP
    parts.push(`<g transform="translate(${W / 2},0) scale(${s.toFixed(4)}) translate(${-W / 2},${dy.toFixed(1)})" opacity="${wmP.toFixed(3)}">`)
    parts.push(`<path d="${zonePath}" fill="${RED}" filter="url(#glow)" opacity="0.6"/>`)
    parts.push(`<path d="${pisoPath}" fill="#f5f5f5"/>`)
    parts.push(`<path d="${zonePath}" fill="${RED}"/>`)
    parts.push('</g>')
  }

  // Tagline: le 3 parole sotto la linea
  const tagP = easeOutCubic(prog(t, T_TAGLINE))
  if (tagP > 0) {
    parts.push(`<path d="${tagPath}" fill="#8B8F98" opacity="${tagP.toFixed(3)}" transform="translate(0,${((1 - tagP) * 10).toFixed(1)})"/>`)
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="spectrum" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${ZONES[0]}" stop-opacity="0"/>
      <stop offset="0.18" stop-color="${ZONES[0]}"/>
      <stop offset="0.45" stop-color="${ZONES[1]}"/>
      <stop offset="0.72" stop-color="${ZONES[2]}"/>
      <stop offset="0.9" stop-color="${ZONES[3]}"/>
      <stop offset="1" stop-color="${ZONES[3]}" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="11"/></filter>
    <filter id="soft" x="-80%" y="-400%" width="260%" height="900%"><feGaussianBlur stdDeviation="7"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${parts.join('\n  ')}
</svg>`
}

// ── Render con un piccolo pool di concorrenza ──
async function main() {
  const dir = path.join(__dirname, 'frames')
  fs.mkdirSync(dir, { recursive: true })
  const jobs = Array.from({ length: FRAMES }, (_, i) => i)
  let done = 0
  const workers = Array.from({ length: 8 }, async () => {
    while (jobs.length > 0) {
      const i = jobs.shift()
      const svg = frameSvg(i / FPS)
      await sharp(Buffer.from(svg)).png().toFile(path.join(dir, `f${String(i).padStart(4, '0')}.png`))
      if (++done % 60 === 0) console.log(`${done}/${FRAMES}`)
    }
  })
  await Promise.all(workers)
  console.log(`ok: ${FRAMES} frame`)
}

main().catch((e) => { console.error(e); process.exit(1) })
