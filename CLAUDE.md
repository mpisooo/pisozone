# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Cos'è

PisoZone: PWA in italiano per il tracciamento dell'attività fisica, con social (amici, messaggi, gruppi, feed), gamification (crediti, 10 livelli, 18 medaglie, sfide giornaliere, streak con "freeze") e notifiche push. Tutta l'UI e i messaggi di commit sono in italiano.

## Comandi

```bash
npm run dev                 # dev server Vite (http://localhost:5173)
npm run build               # tsc + build di produzione
npm test                    # Vitest (vitest.config.ts dedicata; un file: npx vitest run src/lib/challenges.test.ts)
npm run typecheck           # type-check del client (copre SOLO src/)
npm run typecheck:api       # type-check delle funzioni /api in NodeNext (intercetta import senza .js)
```

CI in `.github/workflows/ci.yml`: typecheck ×2 + test + build a ogni push/PR — è il semaforo da controllare prima del deploy (che resta manuale). Niente lint configurato. `gh` CLI non installata: stato delle run via `curl https://api.github.com/repos/mpisooo/pisozone/actions/runs?per_page=1`.

## Deploy — ATTENZIONE

Il progetto Vercel `pisozone-app` **NON è collegato a GitHub**: il push su main non deploya nulla. Deploy manuale:

```bash
npx vercel --prod --yes     # CLI già autenticata; produzione = https://pisozone-app.vercel.app
```

Le migrazioni DB (`supabase-schema/supabase-schema-vN.sql`, incrementali, numerate) **le esegue l'utente a mano nel SQL editor di Supabase** — Claude non ha accesso SQL diretto. Ogni modifica allo schema = nuovo file vN+1, mai modificare i file già eseguiti. Scrivere codice client tollerante all'ordine deploy/migrazione (es. campi opzionali nel tipo finché la colonna non esiste).

## Architettura

**Client React 19 + Vite + Tailwind v4 (no config file) che parla direttamente a Supabase via RLS.** Non c'è un backend proprio: la logica server vive in (a) trigger e RPC Postgres, (b) poche funzioni serverless Vercel in `api/` con service role.

- **Auth**: username+password su Supabase Auth con email finta `{username}@pisozone.local`. L'email di recupero, se verificata, SOSTITUISCE quella finta in `auth.users.email`.
- **Stato condiviso**: `context/ProfileContext.tsx` è l'unica fonte del profilo (`hooks/useProfile.ts` è solo un re-export). Il suo `updateProfile` fa **upsert dell'oggetto completo** con default espliciti: aggiungere un campo a `Profile` richiede attenzione (campo opzionale se la colonna può non esistere ancora).
- **Streak**: UNICA implementazione in `lib/challenges.ts` → `calcStreak(activities, frozenDates)` con i freeze da `useStreakFreeze`. Non ricalcolarlo a mano (regressione già successa in Calendar.tsx).
- **Sfide giornaliere**: `hooks/useDailyChallenges.ts` è l'unica fonte (Home e Challenges la condividono); i template in `lib/challenges.ts` (`CHALLENGE_POOL`, selezione deterministica per utente+data via PRNG). Le sfide devono essere completabili in giornata (mai basate su streak multi-giorno).
- **Crediti/livelli/temi/cornici**: mutazioni SOLO via RPC atomiche Postgres (`unlock_next_level`, `purchase_theme`, ...), mai update diretti dei crediti.
- **Push**: insert su `messages`/`friendships` → webhook Supabase (header `x-webhook-secret`) → `api/webhooks/*` → web-push. Bloccare l'insert (rate limit) blocca anche la notifica.
- **Rate limiting**: trigger Postgres `enforce_insert_rate_limit()` (v23+v24) su messages/group_messages/friendships, conteggio sul registro insert-only `rate_limit_events`. L'errore ha prefisso `RATE_LIMIT`, riconosciuto da `lib/errors.ts` → i hook mostrano toast dedicati. Sulle `/api` c'è anche un limiter per IP best-effort (`api/_lib/rateLimit.ts`).
- **GDPR**: pagine pubbliche `/privacy` e `/termini` (fuori da ProtectedRoute); export dati client-side (`lib/dataExport.ts`); cancellazione account in `api/account/delete.ts` (identità dal JWT, mai dal body); `profiles.terms_accepted_at` NULL = ConsentGate bloccante.
- **Tema**: 6 temi applicati da ThemeContext via CSS var (`--black`, `--grey`, `--red`, `--accent-rgb`, ...). In `src/index.css` ci sono override `html.light .text-white` ecc. MAI hardcodare l'accento (`#F44352`): usare `var(--red)`, `var(--red-dark)`, `rgba(var(--accent-rgb),x)` — vale anche negli attributi SVG di Recharts. Eccezioni deliberate col rosso fisso: pagine pre-login (Auth/Splash/Privacy/Terms) e colori semantici (scala BMI, confetti).
- **Logica in moduli puri**: i calcoli vivono in `src/lib/` testati con Vitest (`challenges.ts`, `achievementStats.ts`, `stats.ts`), le pagine restano sottili. Le funzioni di `lib/stats.ts` (aggregazioni della pagina Statistiche, CSV per Excel italiano con `;` e virgola decimale) prendono `now` come parametro per test deterministici; `lib/dataExport.ts` ha i download JSON/CSV (il CSV con BOM UTF-8 per Excel).
- **Social/moderazione** (v26): commenti (`activity_comments`), blocchi (`user_blocks` + funzione security definer `is_blocked_between()` innestata nelle policy INSERT di messages/friendships), segnalazioni insert-only (`user_reports`), classifica globale via RPC `get_global_leaderboard` (solo aggregati settimanali, mai attività grezze). Client: `useComments`, `useBlocks`, `useLeaderboard(scope)`.
- **UI one-shot via flag su `profiles`**: `push_prompt_seen` (prompt push), `terms_accepted_at` NULL → ConsentGate, `onboarding_seen` false → OnboardingTour. Stesso pattern per flag futuri: colonna con default, campo opzionale nel tipo TS finché la migrazione non è eseguita.

## Convenzioni in `api/`

- Import relativi **con estensione `.js`** (`from '../_lib/sentry.js'`) — ESM su Vercel, dimenticarla causa ERR_MODULE_NOT_FOUND in produzione (già successo).
- Ogni handler è avvolto in `withSentry` (`api/_lib/sentry.ts`); errori non-fatali via `captureError`.
- `api/_lib/push.ts` esporta `supabaseAdmin` ma al load inizializza web-push (richiede le VAPID env): nelle funzioni che non inviano push, creare un client admin locale invece di importarlo.
- Env server: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_WEBHOOK_SECRET`, `VAPID_*`, `SENTRY_*`; l'URL Supabase si legge da `VITE_SUPABASE_URL` (condivisa col client).

## Convenzioni UI

- Design system in `src/index.css`: classi `.card`, `.btn-primary`, `.input-dark`, `.skeleton`, heatmap `heatmap-0..4`. Font: Bebas Neue per i titoli (`.font-bebas`), Inter per il body. Gli stili inline `style={{...}}` sono la convenzione del codebase (ignorare i warning del linter).
- Ogni modale/popup DEVE seguire il pattern accessibile: `useFocusTrap(ref, open, onClose)` + `role="dialog"` + `aria-modal` + chiusura con Esc (riferimento: `ActivityEditModal.tsx`). Gli overlay auto-dismissivi usano invece `role="status"` + `aria-live`.
- Rotte in `App.tsx`: pubbliche (`/auth`, `/privacy`, `/termini`) fuori da ProtectedRoute; il resto dentro AppLayout con lazy loading per pagina.
- Errori utente: messaggi in italiano, concreti, con invito a riprovare (mai `error.message` grezzo).

## Gotcha noti

- Le env var inlined nel `define` di `vite.config.ts` hanno `.trim()` apposta: una newline finale nella key su Vercel rompeva SOLO il WebSocket realtime (sintomo: `%0A` nell'URL in console).
- `tsconfig.json` ha `include: ["src"]` — errori in `api/` non emergono dal type-check standard.
- Il service worker (`public/sw.js`) è cache-first: dopo un deploy l'HTML vecchio può sopravvivere finché la PWA non viene riaperta da zero.
- RLS su `profiles` permette la SELECT a tutti gli utenti autenticati (serve per la ricerca amici): non mettere dati sensibili in quella tabella senza rivedere le policy.
