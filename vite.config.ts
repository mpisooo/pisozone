import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'

// L'upload delle source map su Sentry (stack trace leggibili in produzione)
// avviene solo se SENTRY_AUTH_TOKEN è impostato (su Vercel); in locale la
// build resta identica a prima.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN)

// Report treemap del bundle, solo su richiesta (npm run build:analyze):
// stats.html finisce nella root del progetto, MAI in dist/, così non viene
// mai pubblicato — è uno strumento di analisi locale, non un asset servito.
const analyzeBundle = Boolean(process.env.ANALYZE)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    uploadSourceMaps && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        // Le map servono solo a Sentry: non vanno pubblicate su Vercel
        filesToDeleteAfterUpload: ['dist/**/*.map'],
      },
    }),
    analyzeBundle && visualizer({
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  build: {
    // 'hidden' genera le map senza referenziarle nei bundle serviti
    sourcemap: uploadSourceMaps ? 'hidden' : false,
    rollupOptions: {
      output: {
        // @supabase/supabase-js e recharts sono le librerie più pesanti:
        // senza un chunk dedicato, Rollup le duplica dentro ogni chunk che le
        // importa (successo prima di questo intervento: due chunk da ~360kB
        // quasi identici). Isolarle in vendor chunk stabili le fa scaricare
        // e cachare una sola volta, condivisa da tutte le pagine.
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase'
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-recharts'
        },
      },
    },
  },
  // Explicitly embed env vars at build time so Vercel picks them up correctly.
  // trim(): un newline incollato per errore nella env var su Vercel finisce
  // URL-encoded (%0A) nella query string del WebSocket realtime e Supabase
  // rifiuta l'auth — gli header HTTP invece lo tollerano, quindi il bug
  // colpisce solo il realtime ed è difficile da notare.
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify((process.env.VITE_SUPABASE_URL ?? '').trim()),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify((process.env.VITE_SUPABASE_ANON_KEY ?? '').trim()),
    'import.meta.env.VITE_SENTRY_DSN': JSON.stringify((process.env.VITE_SENTRY_DSN ?? '').trim()),
  },
})
