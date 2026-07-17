# PisoZone

PWA in italiano per il tracciamento dell'attività fisica, con social, gamification e notifiche push.

**Produzione:** https://pisozone-app.vercel.app

## Funzionalità

- **Attività**: registrazione manuale di 15 tipi di sport con durata, calorie (stimate via MET), distanza e note; log palestra strutturato (esercizi con serie × ripetizioni × carico, record personali rilevati automaticamente); calendario con heatmap e statistiche approfondite (andamento, obiettivo vs reale, correlazione peso-allenamento, export CSV).
- **Gamification**: crediti, 10 livelli, 22 medaglie, sfide giornaliere generate in modo deterministico per utente, streak con "freeze" acquistabili.
- **Recupero**: giorni di riposo intenzionali che non spezzano la streak (max 2 a settimana), idratazione e sonno tracciati con un tocco dalla Home.
- **Programmi**: piani di allenamento a più settimane (5K, 10K, palestra, yoga...) con sessioni che si spuntano da sole registrando le attività e ricompensa in crediti al traguardo.
- **Obiettivi personali**: mete libere ("100 km di corsa questo mese", "20 sessioni di palestra") con barra di avanzamento dedicata in Home.
- **Social**: amici, messaggi diretti e di gruppo, feed con reazioni (❤️💪🔥👏🚀), commenti e foto sulle attività, classifica settimanale tra amici o globale, blocco e segnalazione utenti.
- **Push**: notifiche per messaggi, richieste di amicizia e promemoria serale, via web-push (VAPID).
- **Personalizzazione**: 6 temi colore e cornici avatar sbloccabili con i crediti.
- **GDPR**: privacy policy, termini di servizio, export completo dei dati in JSON, cancellazione account.

## Stack

React 19 + Vite + Tailwind v4 (client) · Supabase (Postgres con RLS, Auth, Realtime, Storage) · funzioni serverless Vercel in `api/` (webhook push, cancellazione account, promemoria cron) · Sentry per il monitoraggio errori.

Non c'è un backend proprio: il client parla direttamente a Supabase e la logica server vive in trigger/RPC Postgres e nelle poche funzioni in `api/`.

## Sviluppo

```bash
npm install
npm run dev                 # http://localhost:5173
```

Env richieste in `.env.local` (le stesse, più quelle server, vanno su Vercel):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_VAPID_PUBLIC_KEY=...   # opzionale: push
VITE_SENTRY_DSN=...         # opzionale: monitoraggio
```

### Verifiche

```bash
npm test                    # Vitest (un file: npx vitest run src/lib/stats.test.ts)
npm run typecheck           # client (src/)
npm run typecheck:api       # funzioni api/ in NodeNext
npm run build               # tsc + build di produzione
```

La CI (`.github/workflows/ci.yml`) esegue tutte e quattro a ogni push/PR.

## Deploy

Il progetto Vercel **non è collegato a GitHub**: il deploy è manuale, dopo aver controllato che la CI sia verde.

```bash
npx vercel --prod --yes
```

Le migrazioni del database (`supabase-schema/supabase-schema-vN.sql`) sono incrementali e numerate: si eseguono a mano nel SQL editor di Supabase, in ordine. Mai modificare un file già eseguito — ogni cambiamento allo schema è un nuovo file `vN+1`.

## Struttura

```
src/pages/        una route per file (lazy loading)
src/components/   componenti condivisi e design system (card, modali, skeleton)
src/hooks/        accesso dati via Supabase (attività, amici, messaggi, sfide, ...)
src/context/      Auth, Profile, Theme, Toast, Unread
src/lib/          logica pura testata (streak, sfide, statistiche, export)
api/              funzioni serverless Vercel (ESM, import con estensione .js)
supabase-schema/  migrazioni SQL numerate
```
