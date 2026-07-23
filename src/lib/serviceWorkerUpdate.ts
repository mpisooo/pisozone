import { useSyncExternalStore } from 'react'

// Segnala che una nuova build ha preso il controllo della pagina mentre
// l'app era già aperta (P0-08, roadmap "PisoZone Next"): public/sw.js chiama
// self.skipWaiting() all'install, quindi 'controllerchange' su
// navigator.serviceWorker (agganciato in main.tsx) è già il segnale giusto,
// senza bisogno di gestire uno stato "waiting" esplicito.
const listeners = new Set<() => void>()
let updateAvailable = false

export function markUpdateAvailable(): void {
  if (updateAvailable) return
  updateAvailable = true
  listeners.forEach((listener) => listener())
}

function getSnapshot(): boolean {
  return updateAvailable
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useUpdateAvailable(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
