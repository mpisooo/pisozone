import type { ReactNode } from 'react'

// Pittogrammi degli stati vuoti (roadmap v3, pilastro 01 punto 5): al posto
// delle emoji di sistema, illustrazioni nello stesso linguaggio delle icone
// attività (lib/activityIconPaths) — griglia 48×48, masse piene in
// currentColor, riempimenti tenui via fillOpacity, tratto round. Il wrapper
// <svg> vive in components/EmptyState. Per ritoccarli NON disegnare alla
// cieca: comporre un foglio e rasterizzarlo in PNG (esbuild + react-dom/server
// + sharp), come per le icone attività.
export type EmptyStateIcon = 'rocket' | 'magnifier' | 'trophy' | 'friends' | 'chat' | 'group' | 'bolt'

export const EMPTY_STATE_PATHS: Record<EmptyStateIcon, ReactNode> = {
  // Razzo in decollo: la prima attività che deve ancora partire.
  rocket: (
    <>
      <path
        d="M24 3.5 C29.5 8.5 32 15.5 32 23 C32 27 31 30.5 29.5 33 L18.5 33 C17 30.5 16 27 16 23 C16 15.5 18.5 8.5 24 3.5 Z"
        strokeWidth={4}
        fill="currentColor"
        fillOpacity="0.16"
      />
      <circle cx="24" cy="18.5" r="3.6" fill="currentColor" stroke="none" />
      <path d="M16.5 25.5 L9 34 L17.5 33 Z" fill="currentColor" stroke="none" />
      <path d="M31.5 25.5 L39 34 L30.5 33 Z" fill="currentColor" stroke="none" />
      <path d="M24 37 L24 44" strokeWidth={4} />
      <path d="M19 36.5 L17.5 41" strokeWidth={3} />
      <path d="M29 36.5 L30.5 41" strokeWidth={3} />
    </>
  ),
  // Lente d'ingrandimento: c'è da cercare in un altro periodo.
  magnifier: (
    <>
      <circle cx="20" cy="20" r="12.5" strokeWidth={4} fill="currentColor" fillOpacity="0.12" />
      <path d="M14.5 17.5 C15.5 15 17.5 13.3 20 12.8" strokeWidth={2.5} />
      <path d="M29.5 29.5 L41 41" strokeWidth={6.5} />
    </>
  ),
  // Coppa: la classifica che aspetta i primi risultati.
  trophy: (
    <>
      <path d="M15 5.5 L33 5.5 L33 15.5 C33 21.5 29 25.5 24 25.5 C19 25.5 15 21.5 15 15.5 Z" fill="currentColor" stroke="none" />
      <path d="M15 9.5 L8 9.5 C8 15.5 10.5 19 15.5 20" strokeWidth={3.5} />
      <path d="M33 9.5 L40 9.5 C40 15.5 37.5 19 32.5 20" strokeWidth={3.5} />
      <path d="M24 25.5 L24 34" strokeWidth={5} />
      <rect x="15" y="36.5" width="18" height="6" rx="2.5" fill="currentColor" stroke="none" />
    </>
  ),
  // Due figure, una accanto all'altra: gli amici che mancano ancora.
  friends: (
    <>
      <circle cx="16.5" cy="13.5" r="4.8" fill="currentColor" fillOpacity="0.4" stroke="none" />
      <path
        d="M7.5 32 C7.5 25 11.5 20.8 16.5 20.8 C19 20.8 21.2 21.9 22.8 23.8 C20 26 18.5 29 18.2 32 Z"
        fill="currentColor"
        fillOpacity="0.4"
        stroke="none"
      />
      <circle cx="30.5" cy="15.5" r="5.4" fill="currentColor" stroke="none" />
      <path d="M20.5 36.5 C20.5 28.5 24.8 23.8 30.5 23.8 C36.2 23.8 40.5 28.5 40.5 36.5 Z" fill="currentColor" stroke="none" />
    </>
  ),
  // Fumetto con i puntini: la conversazione che deve ancora iniziare.
  chat: (
    <>
      <path
        d="M11 6.5 L37 6.5 C39.8 6.5 42 8.7 42 11.5 L42 26 C42 28.8 39.8 31 37 31 L23.5 31 L15 39 L15 31 L11 31 C8.2 31 6 28.8 6 26 L6 11.5 C6 8.7 8.2 6.5 11 6.5 Z"
        strokeWidth={4}
        fill="currentColor"
        fillOpacity="0.16"
      />
      <circle cx="16.5" cy="19" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="24" cy="19" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="31.5" cy="19" r="2.3" fill="currentColor" stroke="none" />
    </>
  ),
  // Tre figure: il gruppo da fondare.
  group: (
    <>
      <circle cx="11.5" cy="15" r="4.2" fill="currentColor" fillOpacity="0.4" stroke="none" />
      <path d="M4 31.5 C4 25.5 7.3 21.8 11.5 21.8 C13.4 21.8 15.1 22.6 16.4 24 C14.2 26 13 28.6 12.7 31.5 Z" fill="currentColor" fillOpacity="0.4" stroke="none" />
      <circle cx="36.5" cy="15" r="4.2" fill="currentColor" fillOpacity="0.4" stroke="none" />
      <path d="M44 31.5 C44 25.5 40.7 21.8 36.5 21.8 C34.6 21.8 32.9 22.6 31.6 24 C33.8 26 35 28.6 35.3 31.5 Z" fill="currentColor" fillOpacity="0.4" stroke="none" />
      <circle cx="24" cy="16.5" r="5.4" fill="currentColor" stroke="none" />
      <path d="M14 37.5 C14 29.5 18.3 24.8 24 24.8 C29.7 24.8 34 29.5 34 37.5 Z" fill="currentColor" stroke="none" />
    </>
  ),
  // Fulmine: l'energia del feed che aspetta le prime attività.
  bolt: (
    <>
      <path d="M27.5 4 L12 27 L21.5 27 L19.5 44 L36 20 L26 20 Z" fill="currentColor" stroke="none" />
    </>
  ),
}
