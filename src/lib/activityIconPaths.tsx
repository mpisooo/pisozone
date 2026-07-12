import type { ReactNode } from 'react'
import type { ActivityType } from '../types'

// Geometria grezza (senza <svg> wrapper: quello vive in components/ActivityIcon,
// qui solo i tratti) del set di icone per i 15 sport (roadmap v2, pilastro 01
// punto 3). Stile "pittogramma pieno" in 2D piatto — figure con massa corporea
// e pose riconoscibili come le emoji di sistema, ma monocromatiche
// (currentColor) così ereditano i colori dell'app. Griglia 48×48 con un
// linguaggio condiviso che fa leggere il set come UNA famiglia:
// - figure umane: testa piena r=4, busto spesso (strokeWidth 6.5),
//   arti a tratto 4.5 con round cap;
// - palloni: cerchio r=16 con riempimento tenue (fillOpacity, secondo tono
//   dello stesso colore) e cuciture a tratto 3;
// - attrezzi: masse piene (fill) per le parti solide, tratto per i profili.
export const ACTIVITY_ICON_PATHS: Record<ActivityType, ReactNode> = {
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
      <circle cx="28.5" cy="15" r="4.5" fill="currentColor" stroke="none" />
      <path d="M12 19 L20.5 6.5 L33 9 L38.5 15" />
      <path d="M4.5 27.5 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0" strokeWidth={4} />
      <path d="M11.5 36.5 c3.2 -4.4 6.3 -4.4 9.5 0 c3.2 4.4 6.3 4.4 9.5 0 c3.2 -4.4 6.3 -4.4 9.5 0" strokeWidth={4} />
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
}
