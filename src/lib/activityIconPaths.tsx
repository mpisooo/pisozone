import type { ReactNode } from 'react'
import type { ActivityType } from '../types'

// Geometria grezza (senza <svg> wrapper: quello vive in components/ActivityIcon,
// qui solo i tratti) del set di icone di linea per i 15 sport (roadmap v2,
// pilastro 01 punto 3) — sostituisce le emoji di sistema come iconografia
// primaria, il tell "generico" #1 dell'app secondo la roadmap. Stessa griglia
// 24×24 e lo stesso stroke per tutte (impostati una volta sola in
// ActivityIcon), così il set legge come UNA famiglia coerente e non come 15
// disegni scollegati — gli sport con palla condividono lo stesso cerchio base
// con un pattern interno diverso, le figure umane la stessa costruzione
// testa+busto+arti.
export const ACTIVITY_ICON_PATHS: Record<ActivityType, ReactNode> = {
  corsa: (
    <>
      <circle cx="13" cy="4" r="1.6" />
      <path d="M7 21l3-5 3 2 1 3M10 16l-1-4 4-2 2 3 3 1M5 12l3-1" />
    </>
  ),
  camminata: (
    <>
      <circle cx="11" cy="4" r="1.6" />
      <path d="M11 6.3v4.3" />
      <path d="M11 10.6l-2.6 2.8-.3 3.8M11 10.6l2.8 1.8.6 4.6M8.6 10.1l3.3-1" />
    </>
  ),
  nuoto: (
    <>
      <circle cx="7.5" cy="6.5" r="1.6" />
      <path d="M9.5 8.3l3 2-1 3.2 4 1.2" />
      <path d="M3 17.3c1.4 1.3 2.9 1.3 4.3 0s2.9-1.3 4.3 0 2.9 1.3 4.3 0 2.9-1.3 4.3 0" />
    </>
  ),
  danza: (
    <>
      <circle cx="12" cy="4" r="1.6" />
      <path d="M12 6.3v4.3" />
      <path d="M12 6.8l-3.3-2.2M12 8l3.8-1.4" />
      <path d="M12 10.6l-2.3 6.4M12 10.6l2.8 2.8 1.3 3" />
    </>
  ),
  yoga: (
    <>
      <circle cx="12" cy="5" r="1.6" />
      <path d="M12 7v3.5" />
      <path d="M12 10.5c-2.5 0-4.5 1.9-4.5 4.6V17h9v-1.9c0-2.7-2-4.6-4.5-4.6z" />
      <path d="M12 8.7l-3.3 2M12 8.7l3.3 2" />
    </>
  ),
  arrampicata: (
    <>
      <path d="M3 21L14 4l7 17" />
      <circle cx="9" cy="14.5" r="1" />
      <circle cx="15" cy="10.5" r="1" />
      <circle cx="12" cy="18" r="1" />
    </>
  ),
  bici: (
    <>
      <circle cx="6" cy="17" r="3.2" />
      <circle cx="18" cy="17" r="3.2" />
      <path d="M6 17l4-7h5l-3 7M14 10l2-3h2" />
    </>
  ),
  motocross: (
    <>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M6 17l3-8h6l3 8" />
      <path d="M9 9l2-4h3M15 9l3-1.3" />
      <path d="M12 9v3" />
    </>
  ),
  palestra: <path d="M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10" />,
  calcio: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.6l3.4 2.5-1.3 4h-4.2l-1.3-4L12 7.6z" />
      <path d="M12 7.6V5M15.4 10.1l2.4-1.3M14.1 14.1l1.3 2.3M9.9 14.1l-1.3 2.3M8.6 10.1L6.2 8.8" />
    </>
  ),
  pallavolo: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4c3 2.5 3 13 0 16" />
      <path d="M5 8.3c4.5 2 9.5 2 14 0" />
    </>
  ),
  basket: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4v16" />
      <path d="M6.3 6.3c2.6 3.2 2.6 8.2 0 11.4M17.7 6.3c-2.6 3.2-2.6 8.2 0 11.4" />
    </>
  ),
  tennis: (
    <>
      <ellipse cx="9" cy="7.5" rx="4" ry="5" />
      <path d="M6.5 7.5h5M9 3.2v8.6M9 12.5v7" />
      <circle cx="17.5" cy="17" r="1.8" />
    </>
  ),
  padel: (
    <>
      <ellipse cx="8" cy="9.5" rx="5" ry="5.8" />
      <circle cx="6" cy="7.3" r="0.8" />
      <circle cx="10" cy="7.3" r="0.8" />
      <circle cx="6" cy="10.5" r="0.8" />
      <circle cx="10" cy="10.5" r="0.8" />
      <circle cx="8" cy="12.8" r="0.8" />
      <path d="M8 15.3V21" />
      <circle cx="17.5" cy="17" r="1.8" />
    </>
  ),
  golf: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4l7 3.5L6 11" />
      <ellipse cx="6" cy="21" rx="4" ry="1.3" />
    </>
  ),
}
