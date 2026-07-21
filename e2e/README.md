# Test end-to-end (Playwright)

Roadmap v4, pilastro 04. Copre solo ciò che si può verificare **senza un
account Supabase reale**: pagine pubbliche, il form di login/registrazione
(rendering e validazione, non un vero accesso) e il redirect delle rotte
protette per chi non ha sessione.

**Cosa NON copre, e perché**: login effettivo, log di un'attività, switch
lingua da Profilo — tutti dietro `ProtectedRoute`, quindi richiedono una
sessione Supabase vera. Il progetto non ha un account di test seminato per
l'ambiente CI; aggiungerlo (env var con credenziali dedicate, sia in locale
che nei secret di GitHub Actions) è il passo naturale per estendere la
copertura a quei flussi, non incluso in questa prima passata.

## Comandi

```bash
npx playwright test              # tutta la suite, headless
npx playwright test --ui          # modalità interattiva
npx playwright show-report        # ultimo report HTML
```

`webServer` in `playwright.config.ts` avvia `npm run dev` da solo se non è
già in ascolto su `:5173` — non serve avviarlo a mano prima.
