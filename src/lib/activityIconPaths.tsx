import type { ReactNode } from 'react'
import type { ActivityType } from '../types'

// Geometria grezza (senza <svg> wrapper: quello vive in components/ActivityIcon,
// qui solo i tratti) del set di icone per i 20 sport (redesign 2026-07-12,
// roadmap v2 pilastro 01 punto 3). Stile "pittogramma pieno" in 2D piatto —
// figure con massa corporea e pose riconoscibili come le emoji di sistema.
// Griglia 48×48 con un linguaggio condiviso che fa leggere il set come UNA
// famiglia:
// - figure umane: testa piena r=4, busto spesso (strokeWidth 6.5),
//   arti a tratto 4.5 con round cap;
// - palloni: cerchio r=16 con riempimento tenue (fillOpacity, secondo tono
//   dello stesso colore) e cuciture a tratto 3;
// - attrezzi: masse piene (fill) per le parti solide, tratto per i profili.
//
// **Colore fisso per sport** (22/07/2026, richiesta utente dopo le medaglie
// colorate: "ricrea le icone degli sport con tutti i colori"): ogni sport ha
// un hex proprio in ACTIVITY_ICON_COLORS invece di ereditare `currentColor`
// da chi lo usa — stessa eccezione di lib/medalIconPaths.tsx al principio
// "icona = oggetto/famiglia col proprio colore, non un glifo che eredita il
// tema" (vedi CLAUDE.md e memoria feedback_icon_style). Scelta studiata su
// convenzioni reali (Garmin Connect colora per sport: arancione corsa, verde
// bici, azzurro nuoto — qui adattata) e sui colori già stabiliti dalle
// medaglie per la stessa disciplina (corsa blu, palestra viola, montagna
// grigio-pietra), per coerenza cross-sistema. Ogni valore alla scala
// Tailwind 500/600 (eccetto poche 400/700 dove serve più contrasto o
// distanza da un colore vicino) per restare leggibile sia sul tema scuro
// (--grey #2a2a2a) sia su quello chiaro (--grey #EBEBED/bianco).
//
// Tecnica: la geometria di ogni sport resta ESATTAMENTE quella già
// verificata (nessun path toccato) — ogni blocco è avvolto in un
// `<g color={hex}>`, l'attributo di presentazione SVG che fissa il
// `currentColor` ereditato dai path interni (fill/stroke="currentColor")
// al valore scelto, indipendentemente dal className/style di chi usa
// <ActivityIcon>. Chi ha bisogno del colore altrove (badge, barre) legge
// ACTIVITY_ICON_COLORS invece di duplicare gli hex.
export const ACTIVITY_ICON_COLORS: Record<ActivityType, string> = {
  corsa: '#2563EB',
  bici: '#65A30D',
  calcio: '#16A34A',
  pallavolo: '#EAB308',
  basket: '#F97316',
  palestra: '#7C3AED',
  nuoto: '#0EA5E9',
  camminata: '#0D9488',
  tennis: '#84CC16',
  yoga: '#6366F1',
  danza: '#DB2777',
  motocross: '#71717A',
  golf: '#059669',
  arrampicata: '#78716C',
  padel: '#0891B2',
  beach_volley: '#FB923C',
  ping_pong: '#C026D3',
  salto_corda: '#F59E0B',
  trekking: '#B45309',
  boxe: '#DC2626',
  // Catalogo Strava (22/07/2026)
  corsa_trail: '#047857',
  mountain_bike: '#4D7C0F',
  gravel: '#A8A29E',
  canoa: '#0369A1',
  sup: '#06B6D4',
  kayak: '#3B82F6',
  surf: '#14B8A6',
  kitesurf: '#38BDF8',
  canottaggio: '#4338CA',
  windsurf: '#0E7490',
  vela: '#0284C7',
  pattinaggio_ghiaccio: '#22D3EE',
  sci_fondo: '#60A5FA',
  sci_alpino: '#818CF8',
  snowboard: '#A855F7',
  scialpinismo: '#1D4ED8',
  ciaspole: '#94A3B8',
  allenamento: '#F43F5E',
  badminton: '#4ADE80',
  ellittica: '#6B7280',
  pattini_inline: '#E879F9',
  skateboard: '#EA580C',
  step: '#F87171',
  pickleball: '#FACC15',
  crossfit: '#B91C1C',
  hiit: '#C2410C',
  pilates: '#A78BFA',
  racquetball: '#9333EA',
  squash: '#D946EF',
  cricket: '#10B981',
}

const RAW_PATHS: Record<ActivityType, ReactNode> = {
  corsa: (
    <>
      <circle cx="30.5" cy="7.5" r="4" fill="currentColor" stroke="none" />
      <path d="M28.6 12.4 L24.5 25" strokeWidth={6.5} />
      <path d="M39.5 12.5 L34 18 L28.7 13.2 L22.5 18.6 L16.5 15.8" />
      <path d="M24.5 25 L32.5 30.8 L31 39 L36.5 40.8" />
      <path d="M24.5 25 L17.5 31 L10.5 27.5" />
    </>
  ),
  camminata: (
    <>
      <circle cx="25.5" cy="6.5" r="4" fill="currentColor" stroke="none" />
      <path d="M25.2 10.8 L24.5 24.6" strokeWidth={6.5} />
      <path d="M25 13.8 L30 19.6 L32.8 25.8" />
      <path d="M25 13.8 L20 19.6 L17.2 25.8" />
      <path d="M24.5 24.6 L29.2 32.4 L29.8 41.6" />
      <path d="M24.5 24.6 L19.6 32 L15.2 40.4" />
    </>
  ),
  nuoto: (
    <>
      {/* stile libero: bracciata ad arco sopra l'acqua, schiena emersa, onda sotto */}
      <path d="M13.5 21.5 C17 8.5, 31 6, 39.5 15.5" />
      <circle cx="30" cy="17.5" r="4.5" fill="currentColor" stroke="none" />
      <path d="M26.5 22 L13 26.5" strokeWidth={6.5} />
      <path d="M4.5 33.5 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0" strokeWidth={4} />
    </>
  ),
  danza: (
    <>
      <circle cx="23" cy="6.5" r="4" fill="currentColor" stroke="none" />
      <path d="M23.4 10.8 L24 18.5" strokeWidth={6.5} />
      <path d="M24 13.5 L31 9 L37.5 3.5" />
      <path d="M24 13.5 L16.8 15.8 L9.8 19.5" />
      <path d="M24 17.5 C21 25 16.5 31.5 12.5 37 L35.5 37 C31.5 31.5 27 25 24 17.5 Z" fill="currentColor" stroke="none" />
      <path d="M18.8 37 L17.8 43.5" />
      <path d="M29.2 37 L30.2 43.5" />
    </>
  ),
  yoga: (
    <>
      <circle cx="24" cy="6" r="4" fill="currentColor" stroke="none" />
      <path d="M24 13.5 L24 23.5" strokeWidth={6} />
      <path d="M24 16 L30.5 20.5 L34.5 26.5" />
      <path d="M24 16 L17.5 20.5 L13.5 26.5" />
      <path d="M24 25 C30 25 35.5 27.5 37.5 31.5 C33 36 15 36 10.5 31.5 C12.5 27.5 18 25 24 25 Z" fill="currentColor" stroke="none" />
    </>
  ),
  arrampicata: (
    <>
      <circle cx="24" cy="8" r="4" fill="currentColor" stroke="none" />
      <path d="M24 12.5 L24 24.5" strokeWidth={6.5} />
      <path d="M24 15 L16.5 10.5 L14 5" />
      <path d="M24 15 L31.5 10.5 L34 5" />
      <path d="M24 24.5 L16 28.5 L17.5 36.5" />
      <path d="M24 24.5 L32 28.5 L30.5 36.5" />
      <circle cx="9" cy="20" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="39" cy="26" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="24" cy="42" r="2.2" fill="currentColor" stroke="none" />
    </>
  ),
  bici: (
    <>
      <circle cx="10.5" cy="35.5" r="7" strokeWidth={4} />
      <circle cx="37.5" cy="35.5" r="7" strokeWidth={4} />
      <path d="M10.5 35.5 L19.5 23.5 L24 35 L33.5 21" strokeWidth={3.5} />
      <path d="M37.5 35.5 L33.5 20.5" strokeWidth={3.5} />
      <circle cx="32.5" cy="8.5" r="4" fill="currentColor" stroke="none" />
      <path d="M20 22.5 L29.5 13" strokeWidth={6.5} />
      <path d="M29 14 L34.5 20.5" />
      <path d="M20 22.5 L27.5 28.5 L24.5 34.5" />
    </>
  ),
  motocross: (
    <>
      <circle cx="10" cy="36" r="7" strokeWidth={4} />
      <circle cx="38" cy="36" r="7" strokeWidth={4} />
      <circle cx="10" cy="36" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="38" cy="36" r="1.8" fill="currentColor" stroke="none" />
      <path d="M5.5 25.5 L13 21.5 L24 21.5 L32 26 L27.5 31.5 L15 31.5 Z" fill="currentColor" stroke="none" />
      <path d="M38 35.5 L30 14.5" strokeWidth={4} />
      <path d="M26.5 16 L35 13" />
      <path d="M32.7 21.5 L43 17" strokeWidth={4} />
    </>
  ),
  palestra: (
    <>
      <path d="M7.5 9 L40.5 9" strokeWidth={3.5} />
      <path d="M11.5 3.5 L11.5 14.5" strokeWidth={5} />
      <path d="M36.5 3.5 L36.5 14.5" strokeWidth={5} />
      <circle cx="24" cy="16.5" r="3.7" fill="currentColor" stroke="none" />
      <path d="M15.5 9.5 L21.5 20 M32.5 9.5 L26.5 20" strokeWidth={4} />
      <path d="M24 20.5 L24 29" strokeWidth={6.5} />
      <path d="M24 29 L17 34 L17 42 M24 29 L31 34 L31 42" />
    </>
  ),
  calcio: (
    <>
      <circle cx="24" cy="24" r="16" strokeWidth={4} fill="currentColor" fillOpacity="0.16" />
      <path d="M24 17 L30.7 21.8 L28.1 29.7 L19.9 29.7 L17.3 21.8 Z" fill="currentColor" stroke="none" />
      <path d="M24 17 L24 10.2 M30.7 21.8 L37.1 19.7 M28.1 29.7 L32.1 35.2 M19.9 29.7 L15.9 35.2 M17.3 21.8 L10.9 19.7" strokeWidth={3} />
    </>
  ),
  pallavolo: (
    <>
      <circle cx="24" cy="24" r="16" strokeWidth={4} fill="currentColor" fillOpacity="0.16" />
      <path d="M24 24 C26 17 29.5 13.5 35.3 12.7" strokeWidth={3} />
      <path d="M24 24 C17.5 25.5 12 23.5 8.6 19.9" strokeWidth={3} />
      <path d="M24 24 C22 30.5 24 36 28.1 39.5" strokeWidth={3} />
    </>
  ),
  basket: (
    <>
      <circle cx="24" cy="24" r="16" strokeWidth={4} fill="currentColor" fillOpacity="0.16" />
      <path d="M8 24 L40 24 M24 8 L24 40" strokeWidth={3} />
      <path d="M13.2 13.2 C17.6 18 17.6 30 13.2 34.8 M34.8 13.2 C30.4 18 30.4 30 34.8 34.8" strokeWidth={3} />
    </>
  ),
  tennis: (
    <>
      <ellipse cx="17" cy="13.5" rx="8.5" ry="11" strokeWidth={4} fill="currentColor" fillOpacity="0.12" />
      <path d="M13 4.9 L13 22.1 M17 2.5 L17 24.5 M21 4.9 L21 22.1 M9.4 9 L24.6 9 M8.5 13.5 L25.5 13.5 M9.4 18 L24.6 18" strokeWidth={1.8} />
      <path d="M17 24.5 L17 41" strokeWidth={5} />
      <circle cx="35.5" cy="35" r="5.5" fill="currentColor" stroke="none" />
    </>
  ),
  padel: (
    <>
      <rect x="9.5" y="3.5" width="19" height="22" rx="8.5" strokeWidth={4} fill="currentColor" fillOpacity="0.12" />
      <circle cx="15" cy="10.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="23" cy="10.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="19" cy="14.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="23" cy="18.5" r="1.7" fill="currentColor" stroke="none" />
      <path d="M19 25.5 L19 40.5" strokeWidth={5} />
      <circle cx="36.5" cy="34.5" r="5.5" fill="currentColor" stroke="none" />
    </>
  ),
  golf: (
    <>
      <path d="M15 43 L15 5" strokeWidth={3.5} />
      <path d="M15 4.5 L31 10.5 L15 16.5 Z" fill="currentColor" stroke="none" />
      <ellipse cx="20" cy="42.5" rx="10.5" ry="3.2" strokeWidth={3.5} />
      <circle cx="36.5" cy="38.5" r="3.8" fill="currentColor" stroke="none" />
    </>
  ),
  beach_volley: (
    <>
      {/* palla a mezz'aria sopra la rete da spiaggia (banda alta + maglia fino a terra) */}
      <circle cx="24" cy="10" r="8" strokeWidth={3.5} fill="currentColor" fillOpacity="0.16" />
      <path d="M24 10 C25.5 5.5 28 3.5 31.3 3.2 M24 10 C19.5 10.8 16.5 9.5 14.6 7.2" strokeWidth={2.5} />
      <path d="M7 21 L7 44" strokeWidth={3.5} />
      <path d="M41 21 L41 44" strokeWidth={3.5} />
      <path d="M5 22 L43 22" strokeWidth={3.5} />
      <path d="M14.5 24 L14.5 42 M24 24 L24 42 M33.5 24 L33.5 42" strokeWidth={2} />
      <path d="M8.5 30 L39.5 30 M8.5 37 L39.5 37" strokeWidth={2} />
    </>
  ),
  ping_pong: (
    <>
      {/* racchetta a massa piena (la gomma), come le sorelle tennis/padel */}
      <ellipse cx="19" cy="15" rx="11.5" ry="12.5" fill="currentColor" stroke="none" />
      <path d="M19 27.5 L19 41" strokeWidth={5} />
      <circle cx="36.5" cy="34.5" r="5" fill="currentColor" stroke="none" />
    </>
  ),
  salto_corda: (
    <>
      {/* figura a mezz'aria con la corda nel punto più alto del giro */}
      <path d="M12 24.5 C3 -1, 45 -1, 36 24.5" strokeWidth={3.5} />
      <circle cx="24" cy="13.5" r="4" fill="currentColor" stroke="none" />
      <path d="M24 17.5 L24 28" strokeWidth={6.5} />
      <path d="M24 20.5 L13 23.5" />
      <path d="M24 20.5 L35 23.5" />
      <path d="M24 28 L19 34.5 L20.5 41.5" />
      <path d="M24 28 L29 34.5 L27.5 41.5" />
    </>
  ),
  trekking: (
    <>
      <circle cx="27" cy="7.5" r="4" fill="currentColor" stroke="none" />
      <path d="M26 12 L24 24" strokeWidth={6.5} />
      <rect x="16.5" y="12.5" width="6.5" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M25 15 L33 19.5" />
      <path d="M34.5 16 L37.5 41" strokeWidth={3.5} />
      <path d="M24 24 L31 29.5 L30.5 38.5" />
      <path d="M24 24 L17 30.5 L13.5 39" />
    </>
  ),
  boxe: (
    <>
      {/* guantone: pugno pieno con pollice che sporge, polsino staccato da un filo di luce */}
      <rect x="14" y="5" width="21" height="25" rx="10" fill="currentColor" stroke="none" />
      <circle cx="12" cy="23" r="6" fill="currentColor" stroke="none" />
      <rect x="17.5" y="33.5" width="14" height="9.5" rx="2.5" fill="currentColor" stroke="none" />
    </>
  ),

  // — Catalogo Strava (22/07/2026): stesso linguaggio visivo, riuso di pose
  // e template già verificati dove il soggetto è imparentato (corsa/bici/
  // trekking → varianti; racchette → stessa coppia testa+manico+pallina) —
  // vedi ACTIVITY_ICON_COLORS per la scelta colore di ognuno.
  corsa_trail: (
    <>
      <circle cx="30.5" cy="7.5" r="4" fill="currentColor" stroke="none" />
      <path d="M28.6 12.4 L25 22" strokeWidth={6.5} />
      <path d="M37 11 L33 16.5 L28 12.5 L23 17 L18 14.5" />
      <path d="M25 22 L31 28 L29.5 35" />
      <path d="M25 22 L18.5 27 L13 24.5" />
      {/* profilo collina sotto i piedi: distingue il trail dalla corsa piana */}
      <path d="M4 41 L14 30 L20 37 L28 26 L36 35 L44 41 Z" fill="currentColor" fillOpacity="0.18" stroke="none" />
    </>
  ),
  mountain_bike: (
    <>
      <circle cx="10.5" cy="35.5" r="7" strokeWidth={4} />
      <circle cx="37.5" cy="35.5" r="7" strokeWidth={4} />
      {/* tacche pneumatico tassellato */}
      <path d="M10.5 28.3 L10.5 30.3 M10.5 40.7 L10.5 42.7 M3.3 35.5 L5.3 35.5 M15.7 35.5 L17.7 35.5" strokeWidth={2} />
      <path d="M37.5 28.3 L37.5 30.3 M37.5 40.7 L37.5 42.7 M30.3 35.5 L32.3 35.5 M42.7 35.5 L44.7 35.5" strokeWidth={2} />
      <path d="M10.5 35.5 L19.5 23.5 L24 35 L33.5 21" strokeWidth={3.5} />
      <path d="M37.5 35.5 L33.5 20.5" strokeWidth={3.5} />
      <circle cx="32.5" cy="8.5" r="4" fill="currentColor" stroke="none" />
      <path d="M20 22.5 L29.5 13" strokeWidth={6.5} />
      {/* manubrio piatto da mtb, non da corsa */}
      <path d="M24.5 15.5 L34.5 15.5" strokeWidth={2.5} />
      <path d="M20 22.5 L27.5 28.5 L24.5 34.5" />
    </>
  ),
  gravel: (
    <>
      <circle cx="10.5" cy="35.5" r="7" strokeWidth={4} />
      <circle cx="37.5" cy="35.5" r="7" strokeWidth={4} />
      <path d="M10.5 28.3 L10.5 30.3 M3.3 35.5 L5.3 35.5" strokeWidth={2} />
      <path d="M37.5 28.3 L37.5 30.3 M44.7 35.5 L42.7 35.5" strokeWidth={2} />
      <path d="M10.5 35.5 L19.5 23.5 L24 35 L33.5 21" strokeWidth={3.5} />
      <path d="M37.5 35.5 L33.5 20.5" strokeWidth={3.5} />
      <circle cx="32.5" cy="8.5" r="4" fill="currentColor" stroke="none" />
      <path d="M20 22.5 L29.5 13" strokeWidth={6.5} />
      <path d="M29 14 L34.5 20.5" />
      <path d="M20 22.5 L27.5 28.5 L24.5 34.5" />
    </>
  ),
  canoa: (
    <>
      {/* scafo con profilo visibile: stesso trattamento "riempimento tenue +
          contorno" dei palloni (calcio/pallavolo/basket), non solo fillOpacity */}
      <path d="M3 34 Q24 24 45 34 Q24 41 3 34 Z" strokeWidth={3} fill="currentColor" fillOpacity="0.3" />
      <path d="M13 9 L33 39" strokeWidth={3.2} />
      <path d="M10 4 L18 12 L13 15 L6 8 Z" fill="currentColor" stroke="none" />
    </>
  ),
  sup: (
    <>
      <path d="M3 39 Q24 34 45 39 Q24 43 3 39 Z" strokeWidth={2.6} fill="currentColor" fillOpacity="0.3" />
      <circle cx="26" cy="9" r="4" fill="currentColor" stroke="none" />
      <path d="M25.5 13.5 L25 29" strokeWidth={6} />
      {/* pagaia unica, più alta della persona */}
      <path d="M16 7 L34 32" strokeWidth={2.8} />
      <path d="M14 3 L20 9 L16 12 L10 6 Z" fill="currentColor" stroke="none" />
    </>
  ),
  kayak: (
    <>
      <path d="M4 34 Q24 25 44 34 Q24 40 4 34 Z" strokeWidth={3} fill="currentColor" fillOpacity="0.3" />
      {/* pagaia a doppia pala: distingue il kayak dalla canoa */}
      <path d="M10 13 L38 30" strokeWidth={3.2} />
      <path d="M7 8 L15 16 L10 19 L4 11 Z" fill="currentColor" stroke="none" />
      <path d="M41 33 L33 25 L38 22 L44 30 Z" fill="currentColor" stroke="none" />
    </>
  ),
  surf: (
    <>
      <path d="M18 4 C26 4 30 10 28 22 C26 32 20 40 15 44 C11 40 10 30 12 20 C14 10 14 4 18 4 Z" fill="currentColor" stroke="none" />
      <path d="M4 33.5 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0" strokeWidth={3} />
      <path d="M26 33.5 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0" strokeWidth={3} />
    </>
  ),
  kitesurf: (
    <>
      <path d="M8 38 L34 30 L36 34 L10 42 Z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="38" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="20" cy="35" r="1.4" fill="currentColor" stroke="none" />
      {/* vela ad arco in alto, collegata da due linee */}
      <path d="M32 6 C24 8 20 14 24 18 C30 22 40 18 42 10 C38 8 35 6 32 6 Z" fill="currentColor" fillOpacity="0.85" stroke="none" />
      <path d="M27 15 L18 33 M35 15 L26 33" strokeWidth={1.6} />
    </>
  ),
  canottaggio: (
    <>
      <path d="M1 34 Q24 28 47 34 Q24 38 1 34 Z" strokeWidth={2.6} fill="currentColor" fillOpacity="0.3" />
      {/* remi incrociati */}
      <path d="M10 14 L38 26" strokeWidth={2.6} />
      <path d="M38 8 L10 26" strokeWidth={2.6} />
      <path d="M6 10 L14 17 L10 20 L3 13 Z" fill="currentColor" stroke="none" />
      <path d="M42 4 L34 11 L38 14 L45 7 Z" fill="currentColor" stroke="none" />
    </>
  ),
  windsurf: (
    <>
      <path d="M5 38 Q24 33 43 38 Q24 42 5 38 Z" strokeWidth={2.4} fill="currentColor" fillOpacity="0.3" />
      <path d="M24 37 L24 6" strokeWidth={2.6} />
      <path d="M24 8 L40 30 L24 30 Z" fill="currentColor" fillOpacity="0.85" stroke="none" />
    </>
  ),
  vela: (
    <>
      <path d="M8 34 L40 34 L34 42 L14 42 Z" fill="currentColor" stroke="none" />
      <path d="M22 34 L22 6" strokeWidth={2.6} />
      <path d="M22 8 L36 32 L22 32 Z" fill="currentColor" fillOpacity="0.85" stroke="none" />
    </>
  ),
  pattinaggio_ghiaccio: (
    <>
      {/* pattino da ghiaccio: scarpone + lama curva, icona-oggetto come golf/ping_pong */}
      <path d="M10 18 L28 18 C33 18 36 22 36 26 L36 31 L10 31 Z" fill="currentColor" stroke="none" />
      <path d="M5 34 Q23 29 41 34" strokeWidth={3.2} fill="none" />
    </>
  ),
  sci_fondo: (
    <>
      <circle cx="27" cy="7" r="4" fill="currentColor" stroke="none" />
      <path d="M26 11.5 L22 24" strokeWidth={6.5} />
      {/* falcata asimmetrica con racchette: un braccio avanti, uno indietro */}
      <path d="M23 15 L32 11 L38 15" />
      <path d="M23 15 L14 19 L9 14" />
      <path d="M22 24 L29 29 L33 38" />
      <path d="M22 24 L14 28 L7 24" />
      {/* sci sfalsati sotto ciascun piede */}
      <path d="M19 38 L44 34" strokeWidth={2.6} />
      <path d="M1 24 L26 20" strokeWidth={2.6} />
    </>
  ),
  sci_alpino: (
    <>
      <circle cx="22" cy="7" r="4" fill="currentColor" stroke="none" />
      <path d="M23 11 L26 22" strokeWidth={6.5} />
      <path d="M26 14 L35 11" />
      <path d="M26 14 L20 19" />
      <path d="M26 22 L31 29 L30 36" />
      <path d="M26 22 L23 29 L24 36" />
      {/* due sci accostati (non un'unica tavola come lo snowboard) */}
      <path d="M14 37 L38 33" strokeWidth={2} />
      <path d="M14 40 L38 36" strokeWidth={2} />
    </>
  ),
  snowboard: (
    <>
      <circle cx="24" cy="7" r="4" fill="currentColor" stroke="none" />
      <path d="M24 11.5 L24 24" strokeWidth={6.5} />
      <path d="M24 15 L33 17" />
      <path d="M24 15 L15 13" />
      <path d="M24 24 L30 30 L30 35" />
      <path d="M24 24 L18 30 L18 35" />
      {/* tavola unica, posizione laterale */}
      <rect x="8" y="35" width="32" height="4.5" rx="2.2" fill="currentColor" stroke="none" />
    </>
  ),
  // scialpinismo: stessa posa dello sci di fondo (colore diverso basta a
  // distinguerlo nel picker) — stesso riuso già visto tra medaglie corsa.
  scialpinismo: (
    <>
      <circle cx="27" cy="7" r="4" fill="currentColor" stroke="none" />
      <path d="M26 11.5 L22 24" strokeWidth={6.5} />
      <path d="M23 15 L32 11 L38 15" />
      <path d="M23 15 L14 19 L9 14" />
      <path d="M22 24 L29 29 L33 38" />
      <path d="M22 24 L14 28 L7 24" />
      <path d="M19 38 L44 34" strokeWidth={2.6} />
      <path d="M1 24 L26 20" strokeWidth={2.6} />
    </>
  ),
  ciaspole: (
    <>
      <circle cx="27" cy="7.5" r="4" fill="currentColor" stroke="none" />
      <path d="M26 12 L24 24" strokeWidth={6.5} />
      <path d="M25 15 L33 19.5" />
      <path d="M25 15 L17 18" />
      <path d="M24 24 L31 29.5 L30.5 36" />
      <path d="M24 24 L17 30.5 L15 36" />
      {/* racchette da neve ovali sotto i piedi */}
      <ellipse cx="30" cy="39" rx="6" ry="3.2" fill="currentColor" fillOpacity="0.5" stroke="none" />
      <ellipse cx="15.5" cy="39" rx="6" ry="3.2" fill="currentColor" fillOpacity="0.5" stroke="none" />
    </>
  ),
  allenamento: (
    <>
      {/* battito cardiaco: sport generico non legato a un attrezzo specifico */}
      <path d="M24 38 C10 28 6 18 14 12 C19 8.5 24 12 24 17 C24 12 29 8.5 34 12 C42 18 38 28 24 38 Z" fill="currentColor" fillOpacity="0.18" stroke="none" />
      <path d="M8 24 L16 24 L19 17 L23 30 L27 15 L30 24 L40 24" strokeWidth={2.6} />
    </>
  ),
  badminton: (
    <>
      <ellipse cx="16" cy="13" rx="8" ry="10" strokeWidth={3.6} fill="currentColor" fillOpacity="0.12" />
      <path d="M16 23 L16 39" strokeWidth={4.4} />
      {/* volano: cono + testa */}
      <path d="M33 30 L38 40 L30 38 Z" fill="currentColor" stroke="none" />
      <circle cx="33" cy="28.5" r="2.6" fill="currentColor" stroke="none" />
    </>
  ),
  ellittica: (
    <>
      {/* anello pedali ovale (non un cerchio, per non leggersi come un divieto) + colonna manubrio */}
      <ellipse cx="19" cy="31" rx="16" ry="8" strokeWidth={3} />
      <path d="M30 11 L30 25" strokeWidth={3.2} />
      <path d="M25 13 L37 13" strokeWidth={2.6} />
      <circle cx="10" cy="31" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="28" cy="31" r="2.2" fill="currentColor" stroke="none" />
    </>
  ),
  pattini_inline: (
    <>
      <path d="M8 15 L26 15 C31 15 34 19 34 23 L34 27 L12 27 L8 23 Z" fill="currentColor" stroke="none" />
      <path d="M8 27 L38 27 L42 31 L4 31 Z" fill="currentColor" stroke="none" />
      {/* fila di ruote in linea: distingue dal pattino da ghiaccio */}
      <circle cx="13" cy="37" r="3" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="37" r="3" fill="currentColor" stroke="none" />
      <circle cx="28" cy="37" r="3" fill="currentColor" stroke="none" />
      <circle cx="35.5" cy="37" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  skateboard: (
    <>
      <path d="M6 24 C6 20 10 18 16 18 L32 18 C38 18 42 20 42 24 C42 27 38 27 32 27 L16 27 C10 27 6 27 6 24 Z" fill="currentColor" stroke="none" />
      <circle cx="14" cy="31" r="4" fill="currentColor" stroke="none" />
      <circle cx="34" cy="31" r="4" fill="currentColor" stroke="none" />
    </>
  ),
  step: (
    <path d="M6 40 L6 32 L16 32 L16 24 L26 24 L26 16 L36 16 L36 8 L42 8" strokeWidth={4} fill="none" />
  ),
  pickleball: (
    <>
      {/* paletta piena e rettangolare: distingue il pickleball dalle racchette a testa ovale */}
      <rect x="8" y="4" width="18" height="24" rx="9" fill="currentColor" stroke="none" />
      <path d="M17 28 L17 41" strokeWidth={5} />
      <circle cx="34" cy="33" r="5.5" fill="currentColor" stroke="none" />
    </>
  ),
  crossfit: (
    <>
      {/* kettlebell: massa piena + maniglia ad arco */}
      <path d="M18 12 C18 7 21 4 24 4 C27 4 30 7 30 12" strokeWidth={3.6} />
      <circle cx="24" cy="27" r="15" fill="currentColor" stroke="none" />
      <rect x="18" y="10" width="12" height="6" rx="2.5" fill="currentColor" stroke="none" />
    </>
  ),
  hiit: (
    <>
      <circle cx="24" cy="24" r="17" strokeWidth={3.4} fill="currentColor" fillOpacity="0.12" />
      <path d="M26.5 12 L16.5 26 L23 26 L21 37 L32 21 L24.5 21 Z" fill="currentColor" stroke="none" />
    </>
  ),
  pilates: (
    <>
      {/* figura distesa in stiramento: distingue dalla posa seduta dello yoga */}
      <circle cx="10" cy="30" r="4" fill="currentColor" stroke="none" />
      <path d="M14 30 L26 30" strokeWidth={6} />
      <path d="M26 30 L34 22 L34 12" />
      <path d="M26 30 L32 36 L40 36" />
      <path d="M14 30 L12 38 L18 40" />
    </>
  ),
  racquetball: (
    <>
      <ellipse cx="17" cy="14" rx="9.5" ry="10.5" strokeWidth={4} fill="currentColor" fillOpacity="0.12" />
      <path d="M17 24.5 L17 41" strokeWidth={5} />
      <circle cx="34.5" cy="35" r="5" fill="currentColor" stroke="none" />
    </>
  ),
  squash: (
    <>
      <ellipse cx="16" cy="13" rx="7.5" ry="11.5" strokeWidth={3.6} fill="currentColor" fillOpacity="0.12" />
      <path d="M16 24.5 L16 41" strokeWidth={4.6} />
      <circle cx="33" cy="35" r="4.2" fill="currentColor" stroke="none" />
    </>
  ),
  cricket: (
    <>
      {/* mazza + palla */}
      <path d="M14 6 L20 6 L20 26 C20 30 14 30 14 26 Z" fill="currentColor" stroke="none" />
      <rect x="15.5" y="28" width="3" height="12" rx="1.4" fill="currentColor" stroke="none" />
      <circle cx="34" cy="16" r="5.5" fill="currentColor" stroke="none" />
    </>
  ),
}

export const ACTIVITY_ICON_PATHS: Record<ActivityType, ReactNode> = Object.fromEntries(
  (Object.keys(RAW_PATHS) as ActivityType[]).map((type) => [
    type,
    <g color={ACTIVITY_ICON_COLORS[type]}>{RAW_PATHS[type]}</g>,
  ]),
) as Record<ActivityType, ReactNode>
