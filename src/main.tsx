// Va importato per primo: registra i global handler prima di ogni altro codice.
import './lib/sentry'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { markUpdateAvailable } from './lib/serviceWorkerUpdate'
import { captureInstallPromptEvent } from './lib/pwaInstall'

// beforeinstallprompt (P2-02, roadmap "PisoZone Next") va catturato appena il
// browser lo emette (preventDefault sopprime il mini-infobar nativo di
// Chrome): il momento in cui MOSTRARLO all'utente resta deciso altrove
// (PwaInstallPrompt.tsx), dopo un segnale di valore reale.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  captureInstallPromptEvent(e)
})

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // public/sw.js chiama self.skipWaiting() all'install: la nuova build
      // prende il controllo subito, senza un vero stato "waiting" da
      // gestire. I browser ricontrollano da soli su navigazione, ma un tab
      // tenuto aperto (uso PWA previsto) non naviga mai — stesso principio
      // della coda offline: ricontrolla quando l'app torna davvero in
      // primo piano (P0-08, roadmap "PisoZone Next").
      const checkForUpdate = () => registration.update().catch(() => {})
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
      window.addEventListener('online', checkForUpdate)
    }).catch(() => {
      // SW registration failed — app still works online
    })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      markUpdateAvailable()
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
