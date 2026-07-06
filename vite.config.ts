import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// L'upload delle source map su Sentry (stack trace leggibili in produzione)
// avviene solo se SENTRY_AUTH_TOKEN è impostato (su Vercel); in locale la
// build resta identica a prima.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN)

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
  ],
  build: {
    // 'hidden' genera le map senza referenziarle nei bundle serviti
    sourcemap: uploadSourceMaps ? 'hidden' : false,
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
