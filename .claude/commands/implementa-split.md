---
description: Implementa lo split per km nel tracciamento GPS (roadmap v2, pilastro 02) e segue il ciclo standard di rilascio
---

Implementa il sotto-punto "split per chilometro" di **GPS potenziato** (roadmap v2, pilastro 02 — vedi memoria `project_roadmap_v2.md`, sezione "IN CORSO — GPS potenziato, riprendere da qui", e l'item corrispondente nell'artifact roadmap-v2, ora marcato `item wip`).

## La feature

I dati servono già tutti: `activity_routes` salva lat/lng **e `recorded_at`** per ogni campione dalla v29 (vedi `supabase-schema-v29.sql`, `src/lib/gps.ts`, `src/hooks/useGpsTracking.ts`). Zero migrazione, zero dipendenza nuova, funziona **retroattivamente** su ogni percorso GPS già registrato.

1. In `src/lib/gps.ts`: nuova funzione pura (es. `computeSplits`) che segmenta il percorso in blocchi cumulativi da 1 km e calcola il passo (min/km) per ciascuno. Gestisci il caso dell'ultimo blocco parziale (< 1km) in modo esplicito, non fingerlo come uno split completo.
2. Test in `src/lib/gps.test.ts` (esiste già, segui lo stile delle describe/it esistenti): percorso vuoto, meno di 1km, più split completi, ultimo split parziale, punti con timestamp non crescenti/duplicati (difendersi come già fa `isPlausibleSample`).
3. UI: mostra gli split dove oggi c'è solo `RouteShape` — verosimilmente `ActivityEditModal.tsx` (sezione GPS in sola lettura quando `activity.gps_tracked`, vedi come viene già passato `activity_routes`). Segui le convenzioni del progetto: design tokens (mai colori hardcoded), stringhe in `src/lib/i18n/` (namespace `log`, sezione dedicata o nuova), niente librerie esterne per il rendering (una tabella o mini-barre bastano).

## Ciclo di rilascio standard — segui questi passi in ordine, senza fermarti a chiedere conferma tra uno e l'altro

1. Implementa la feature.
2. `npm run typecheck` e `npm run typecheck:api` — entrambi verdi.
3. `npm test` — tutti verdi (comprese le nuove).
4. `npm run build` — verifica che compili in produzione.
5. Se cambia qualcosa di architetturale non ovvio, aggiorna `CLAUDE.md`.
6. La feature è visibile all'utente: aggiorna la Guida in-app (`src/lib/i18n/guide.ts`, sezione "Tracciamento GPS") e valuta se serve un bump di `NEWS_VERSION` in `WhatsNewOverlay.tsx` + relativo item in `shell.ts`.
7. Commit con messaggio in italiano che spieghi il "perché", non il "cosa" (`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`).
8. Deploy: `npx vercel --prod --yes`.
9. Aggiorna l'artifact della roadmap v2 (sorgente HTML nella scratchpad della sessione `53effc3f-9534-4807-b061-59c008686c73`, file `roadmap-v2.html`) segnando questo sotto-punto come fatto — SENZA chiudere l'intero item "GPS potenziato" (restano altimetria e mappa), e aggiorna la memoria persistente `project_roadmap_v2.md` di conseguenza.
10. Riporta all'utente, in breve, cosa è stato fatto e cosa resta (altimetria, poi mappa via MapTiler appena arriva la API key).

Istruzioni aggiuntive dell'utente per questa esecuzione, se presenti: $ARGUMENTS
