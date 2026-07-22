import type { ReactNode } from 'react'
import type { MedalTier } from '../types'

// Geometria delle 23 icone medaglia (richiesta utente: "stesso stile delle
// icone sport, ma con la classica cornice della medaglia, usa tutti i colori
// disponibili"). A differenza di ACTIVITY_ICON_PATHS (monocromatiche via
// currentColor, ricolorate da chi le usa), qui i colori sono FISSI dentro
// l'SVG: stessa eccezione già documentata in CLAUDE.md per i colori semantici
// (scala BMI, spettro Zone) — una medaglia è un oggetto reale con un colore
// proprio, non un'icona che eredita il tema.
//
// Ogni medaglia è composta da 3 strati, sempre nello stesso ordine (griglia
// 48×48, coerente con ACTIVITY_ICON_PATHS):
//   1. Nastro — due bande convergenti in alto, colore coordinato al TIER
//      (bronzo/argento/oro/diamante): l'elemento che rende riconoscibile
//      "è una medaglia" anche a icona piccola, come 🏅.
//   2. Disco — cerchio pieno nel colore del TIER + una mezzaluna di sheen
//      (fillOpacity) per un effetto "metallo lucido", poi una placca bianca
//      interna che fa da sfondo neutro al simbolo.
//   3. Simbolo — il pittogramma della "missione" (corsa, palestra, streak,
//      montagna, ecc.), in un colore TEMATICO indipendente dal tier: è qui
//      che vive la varietà di colore richiesta, non nel nastro/disco.
// I simboli sono condivisi tra medaglie della stessa famiglia (dove il tier
// cambia ma il traguardo è lo stesso tipo, es. corsa bronzo/argento/oro) —
// stesso principio di riuso delle pose corpo in ACTIVITY_ICON_PATHS.

interface TierPalette {
  ribbon: string
  discBase: string
  discHighlight: string
}

const TIER_PALETTES: Record<MedalTier, TierPalette> = {
  bronze:  { ribbon: '#8B4A24', discBase: '#C2703D', discHighlight: '#F0AD73' },
  silver:  { ribbon: '#6B7684', discBase: '#B8C0CC', discHighlight: '#F1F5F9' },
  gold:    { ribbon: '#A8791A', discBase: '#E8B93D', discHighlight: '#FDE68A' },
  diamond: { ribbon: '#2E6DA4', discBase: '#7DD3E8', discHighlight: '#E0F7FF' },
}

// Nastro + disco + placca: lo "scheletro" comune a tutte le 23 medaglie.
function medalShell(tier: MedalTier): ReactNode {
  const p = TIER_PALETTES[tier]
  return (
    <>
      <path d="M12 2 L20 2 L23 17 L15.5 17 Z" fill={p.ribbon} stroke="none" />
      <path d="M36 2 L28 2 L25 17 L32.5 17 Z" fill={p.ribbon} stroke="none" />
      <circle cx="24" cy="29" r="17" fill={p.discBase} stroke="none" />
      <path d="M14 22 A11 11 0 0 1 25 15 A15 15 0 0 0 14 22 Z" fill={p.discHighlight} fillOpacity="0.55" stroke="none" />
      <circle cx="24" cy="29" r="12.5" fill="#FFFFFF" fillOpacity="0.94" stroke="none" />
    </>
  )
}

// — Simboli (pittogrammi tematici, centrati su 24,29, colore fisso) —

// Bandierina a scacchi (traguardo di partenza): più leggibile di un'impronta
// a questa scala, e semanticamente calza meglio con "prima attività" (si
// parte). I due quadratini bianchi danno l'effetto scacchi senza affollare.
function startFlagSymbol(color: string): ReactNode {
  return (
    <>
      <rect x="16.3" y="19.5" width="2.2" height="18.5" rx="1.1" fill={color} stroke="none" />
      <path d="M18.5 20 L32 20 L27 25 L32 30 L18.5 30 Z" fill={color} stroke="none" />
      <rect x="20.8" y="21.6" width="2.8" height="2.8" fill="#FFFFFF" stroke="none" />
      <rect x="25.6" y="26.2" width="2.8" height="2.8" fill="#FFFFFF" stroke="none" />
    </>
  )
}

function calendarSymbol(color: string, colorDark: string): ReactNode {
  return (
    <>
      <rect x="15.5" y="21.5" width="17" height="15" rx="2.2" fill={color} stroke="none" />
      <rect x="15.5" y="21.5" width="17" height="4.4" rx="2.2" fill={colorDark} stroke="none" />
      <path d="M19.5 30 L22.5 33.2 L28.5 26.5" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

// Stessa posa di ACTIVITY_ICON_PATHS.corsa, scalata (~0.6×) e ricentrata sul
// simbolo: riusa una figura già verificata visivamente invece di disegnarne
// una nuova alla cieca (il primo tentativo, un'unica massa piena, leggeva
// come una macchia astratta — la posa a tratti (testa piena + arti a stroke)
// resta più riconoscibile anche in miniatura).
function runnerSymbol(color: string): ReactNode {
  return (
    <>
      <circle cx="27.6" cy="22" r="2.4" fill={color} stroke="none" />
      <path d="M26.5 24.9 L24 32.5" stroke={color} strokeWidth="3.9" strokeLinecap="round" fill="none" />
      <path d="M33 25 L29.7 28.3 L26.5 25.4 L22.8 28.7 L19.2 27" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 32.5 L28.8 36 L27.9 40.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M24 32.5 L19.8 36.1 L15.8 34" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  )
}

function dumbbellSymbol(color: string): ReactNode {
  return (
    <>
      <rect x="13.5" y="26" width="4.4" height="9" rx="1.6" fill={color} stroke="none" />
      <rect x="30.1" y="26" width="4.4" height="9" rx="1.6" fill={color} stroke="none" />
      <rect x="16.8" y="27.7" width="14.4" height="5.6" rx="1.8" fill={color} stroke="none" />
    </>
  )
}

function flameSymbol(color: string): ReactNode {
  return (
    <path
      d="M24 19.5 C20.5 24 19 27.5 20.6 30.5 C20.3 28.8 21.6 27.2 22.7 27.6 C21.7 31.2 24.4 33.6 25.1 31.5 C27 33 26.4 36 24 37 C29 37.4 31.6 33.4 29.6 28.8 C31.4 29.7 30.7 26 27.7 23 C27.5 25.3 25.9 24.6 24 19.5 Z"
      fill={color}
      stroke="none"
    />
  )
}

function barsSymbol(color: string): ReactNode {
  return (
    <>
      <rect x="16.5" y="31" width="4.6" height="6" rx="0.8" fill={color} stroke="none" />
      <rect x="21.7" y="25.5" width="4.6" height="11.5" rx="0.8" fill={color} stroke="none" />
      <rect x="26.9" y="20.5" width="4.6" height="16.5" rx="0.8" fill={color} stroke="none" />
    </>
  )
}

function crownSymbol(color: string): ReactNode {
  return (
    <>
      <path d="M15.5 34 L15.5 25 L19.8 29.3 L24 22 L28.2 29.3 L32.5 25 L32.5 34 Z" fill={color} stroke="none" />
      <rect x="15.5" y="34" width="17" height="3.2" rx="0.8" fill={color} stroke="none" />
      <circle cx="24" cy="20.5" r="1.6" fill={color} stroke="none" />
    </>
  )
}

// Tre fasce separate (raggi, sole, orizzonte) invece che sovrapposte: nel
// primo tentativo il bordo piatto del sole coincideva con la riga
// dell'orizzonte e le due forme si fondevano in un'unica macchia.
function sunriseSymbol(color: string, lineColor: string): ReactNode {
  return (
    <>
      <path
        d="M24 15 L24 18.5 M18 17.7 L20.1 20.2 M30 17.7 L27.9 20.2"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M17.3 29 A6.7 6.7 0 0 1 30.7 29 Z" fill={color} stroke="none" />
      <rect x="14.5" y="30.6" width="19" height="2.6" rx="1.3" fill={lineColor} stroke="none" />
    </>
  )
}

function lightningSymbol(color: string): ReactNode {
  return <path d="M26.5 19 L18.5 31 L23 31 L21 39.5 L31 26 L25.5 26 Z" fill={color} stroke="none" />
}

function targetSymbol(color: string): ReactNode {
  return (
    <>
      <circle cx="24" cy="29" r="9.2" fill="none" stroke={color} strokeWidth="2.4" />
      <circle cx="24" cy="29" r="5.2" fill="none" stroke={color} strokeWidth="2.4" />
      <circle cx="24" cy="29" r="1.9" fill={color} stroke="none" />
    </>
  )
}

function varietySymbol(color: string): ReactNode {
  return (
    <>
      <circle cx="19.5" cy="25.5" r="4.1" fill={color} stroke="none" />
      <circle cx="29.5" cy="25.2" r="3.3" fill={color} fillOpacity="0.7" stroke="none" />
      <circle cx="24" cy="34.5" r="3.7" fill={color} fillOpacity="0.85" stroke="none" />
    </>
  )
}

function shieldSymbol(color: string): ReactNode {
  return (
    <path
      d="M24 19.5 L32 22.8 L32 28.5 C32 34.5 28.4 37.5 24 39.5 C19.6 37.5 16 34.5 16 28.5 L16 22.8 Z"
      fill={color}
      stroke="none"
    />
  )
}

function stopwatchSymbol(color: string): ReactNode {
  return (
    <>
      <rect x="21.3" y="16.5" width="5.4" height="2.6" rx="1" fill={color} stroke="none" />
      <circle cx="24" cy="30" r="9.6" fill="none" stroke={color} strokeWidth="2.6" />
      <path d="M24 30 L24 23.8 M24 30 L28.4 32.3" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </>
  )
}

function compassSymbol(color: string): ReactNode {
  return (
    <>
      <circle cx="24" cy="29" r="9.6" fill="none" stroke={color} strokeWidth="2.3" />
      <path d="M24 21.8 L27.3 28.7 L24 29.4 Z" fill={color} stroke="none" />
      <path d="M24 36.2 L20.7 28.7 L24 29.4 Z" fill={color} fillOpacity="0.45" stroke="none" />
    </>
  )
}

function routeSymbol(color: string): ReactNode {
  return (
    <>
      <path
        d="M15.5 36 C17.5 28.5 20 32 22.8 27 C25.5 22.3 27.5 25.5 31.5 20.2"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="31.5" cy="20.2" r="2.7" fill={color} stroke="none" />
    </>
  )
}

function mountainSymbol(color: string, snowCap: boolean): ReactNode {
  return (
    <>
      <path d="M14 36.5 L21 24 L25 29.3 L29 22 L34.5 36.5 Z" fill={color} stroke="none" />
      {snowCap && <path d="M29 22 L31.3 25.7 L26.7 25.7 Z" fill="#FFFFFF" stroke="none" />}
    </>
  )
}

function starSymbol(color: string): ReactNode {
  return (
    <path
      d="M24 18.5 L26.5 24.6 L33 24.9 L27.9 29 L29.8 35.3 L24 31.6 L18.2 35.3 L20.1 29 L15 24.9 L21.5 24.6 Z"
      fill={color}
      stroke="none"
    />
  )
}

// — Le 23 medaglie: guscio (tier) + simbolo (missione) —

export const MEDAL_ICON_PATHS: Record<string, ReactNode> = {
  prima_mossa: (<>{medalShell('bronze')}{startFlagSymbol('#16A34A')}</>),
  settimana_attiva: (<>{medalShell('bronze')}{calendarSymbol('#10B981', '#047857')}</>),
  runner_esordiente: (<>{medalShell('bronze')}{runnerSymbol('#2563EB')}</>),

  maratoneta: (<>{medalShell('silver')}{runnerSymbol('#2563EB')}</>),
  ferro_da_stiro: (<>{medalShell('silver')}{dumbbellSymbol('#7C3AED')}</>),
  costante: (<>{medalShell('silver')}{flameSymbol('#EA580C')}</>),

  centurione: (<>{medalShell('gold')}{barsSymbol('#DC2626')}</>),
  ultra_runner: (<>{medalShell('gold')}{runnerSymbol('#2563EB')}</>),
  leggenda: (<>{medalShell('gold')}{crownSymbol('#CA8A04')}</>),

  mattiniero: (<>{medalShell('bronze')}{sunriseSymbol('#F59E0B', '#475569')}</>),
  doppio_impegno: (<>{medalShell('bronze')}{lightningSymbol('#EAB308')}</>),

  tuttofare: (<>{medalShell('silver')}{targetSymbol('#0D9488')}</>),
  multisport: (<>{medalShell('silver')}{varietySymbol('#C026D3')}</>),
  guerriero_weekend: (<>{medalShell('silver')}{shieldSymbol('#4F46E5')}</>),

  grande_allenatore: (<>{medalShell('gold')}{stopwatchSymbol('#D97706')}</>),
  stagionale: (<>{medalShell('gold')}{calendarSymbol('#10B981', '#047857')}</>),

  esploratore: (<>{medalShell('silver')}{compassSymbol('#0891B2')}</>),
  cartografo: (<>{medalShell('gold')}{routeSymbol('#16A34A')}</>),
  scalatore: (<>{medalShell('silver')}{mountainSymbol('#57534E', false)}</>),
  ottomila: (<>{medalShell('gold')}{mountainSymbol('#57534E', true)}</>),

  inarrestabile: (<>{medalShell('diamond')}{flameSymbol('#EA580C')}</>),
  campione_annuale: (<>{medalShell('diamond')}{starSymbol('#9333EA')}</>),
  instancabile: (<>{medalShell('diamond')}{barsSymbol('#DC2626')}</>),
}
