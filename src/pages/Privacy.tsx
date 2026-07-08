import LegalLayout, { LegalSection } from '../components/LegalLayout'

const CONTACT_EMAIL = 'mattiapisati02@gmail.com'

export default function PrivacyPage() {
  return (
    <LegalLayout title="PRIVACY POLICY" updated="7 luglio 2026">
      <LegalSection title="1. TITOLARE DEL TRATTAMENTO">
        <p>
          Il titolare del trattamento dei dati è Mattia Pisati, sviluppatore e gestore di
          PisoZone. Per qualsiasi richiesta relativa ai tuoi dati puoi scrivere a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F44352] underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. QUALI DATI RACCOGLIAMO">
        <p>PisoZone raccoglie soltanto i dati che inserisci tu per usare l'app:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account</strong> — username e password (conservata in forma cifrata); email di recupero, solo se decidi di aggiungerla.</li>
          <li><strong>Profilo</strong> — nome, data di nascita, genere, altezza, peso e storico delle pesate, foto profilo, obiettivi e sport preferiti. Sono tutti campi facoltativi.</li>
          <li><strong>Attività sportive</strong> — tipo di sport, data, durata, calorie, distanza ed eventuali note e foto che decidi di allegare.</li>
          <li><strong>Funzioni social</strong> — amicizie, richieste di amicizia, messaggi privati e di gruppo, "mi piace" alle attività degli amici.</li>
          <li><strong>Gamification</strong> — crediti, livello, medaglie, sfide completate, streak.</li>
          <li><strong>Notifiche push</strong> — se le attivi, l'identificativo tecnico (endpoint) fornito dal tuo browser per recapitarle.</li>
          <li><strong>Dati tecnici</strong> — in caso di errori dell'app, informazioni diagnostiche (tipo di errore, pagina, browser) tramite il servizio Sentry, associate al tuo id utente e username ma a nessun altro dato personale.</li>
        </ul>
        <p>Non raccogliamo dati di localizzazione, non usiamo tracciamento pubblicitario e non vendiamo dati a terzi.</p>
      </LegalSection>

      <LegalSection title="3. PERCHÉ LI TRATTIAMO">
        <p>
          I dati servono esclusivamente a far funzionare PisoZone: calcolare statistiche e calorie,
          mostrare i tuoi progressi, gestire le funzioni social e le notifiche che hai richiesto
          (base giuridica: esecuzione del servizio, art. 6.1.b GDPR). Il monitoraggio degli errori
          si basa sul legittimo interesse a mantenere l'app funzionante e sicura (art. 6.1.f GDPR).
        </p>
      </LegalSection>

      <LegalSection title="4. DOVE SONO CONSERVATI">
        <p>PisoZone si appoggia a tre fornitori tecnici, che agiscono da responsabili del trattamento:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase</strong> — database e archiviazione delle foto (profilo e attività) (<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#F44352] underline">privacy policy</a>)</li>
          <li><strong>Vercel</strong> — hosting dell'applicazione (<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#F44352] underline">privacy policy</a>)</li>
          <li><strong>Sentry</strong> — monitoraggio errori, con dati ospitati nell'Unione Europea (<a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-[#F44352] underline">privacy policy</a>)</li>
        </ul>
        <p>Nessun altro soggetto ha accesso ai tuoi dati.</p>
      </LegalSection>

      <LegalSection title="5. CHI VEDE COSA">
        <p>
          Alcuni dati sono visibili agli altri utenti solo nell'ambito delle funzioni social: il tuo
          username, la foto profilo, il livello e la cornice sono visibili a chi ti cerca; le tue
          attività (incluse le foto che vi alleghi), i traguardi e i relativi commenti compaiono
          nel feed dei tuoi amici; i messaggi
          sono visibili solo a chi li riceve. Se compari nella classifica globale settimanale, gli
          altri utenti vedono username, foto e i tuoi totali aggregati della settimana (sessioni,
          minuti, calorie) — mai le singole attività. Peso, data di nascita, genere, altezza e
          storico pesate non sono mai visibili ad altri utenti. Puoi bloccare un utente in
          qualsiasi momento dal suo profilo: non potrà più scriverti, inviarti richieste né vedere
          le tue attività.
        </p>
      </LegalSection>

      <LegalSection title="6. PER QUANTO TEMPO">
        <p>
          Conserviamo i dati finché il tuo account è attivo. Se elimini l'account, tutti i tuoi dati
          — profilo, attività, messaggi, foto, amicizie e ogni altro contenuto — vengono cancellati
          immediatamente e in modo definitivo. Non esistono copie di backup accessibili una volta
          completata l'eliminazione.
        </p>
      </LegalSection>

      <LegalSection title="7. I TUOI DIRITTI">
        <p>In qualsiasi momento, direttamente dalla pagina Profilo → sezione "Privacy e dati", puoi:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Esportare</strong> una copia completa di tutti i tuoi dati in formato JSON (diritto alla portabilità, art. 20 GDPR).</li>
          <li><strong>Eliminare</strong> definitivamente l'account e tutti i dati (diritto alla cancellazione, art. 17 GDPR).</li>
          <li><strong>Rettificare</strong> i dati del profilo, modificandoli direttamente.</li>
        </ul>
        <p>
          Hai inoltre diritto di accesso, limitazione e opposizione al trattamento (artt. 15–21
          GDPR): per esercitarli scrivi a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F44352] underline">{CONTACT_EMAIL}</a>.
          Se ritieni che il trattamento violi la normativa, puoi presentare reclamo al Garante per
          la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-[#F44352] underline">garanteprivacy.it</a>).
        </p>
      </LegalSection>

      <LegalSection title="8. COOKIE E ARCHIVIAZIONE LOCALE">
        <p>
          PisoZone non usa cookie di profilazione né strumenti di analytics. Il browser conserva
          localmente solo dati tecnici indispensabili: la sessione di accesso, il tema grafico
          scelto e la cache dell'app per il funzionamento offline (PWA).
        </p>
      </LegalSection>

      <LegalSection title="9. MINORI">
        <p>
          PisoZone non è destinata a minori di 14 anni. Se hai meno di 14 anni non creare un
          account; se un genitore o tutore ritiene che un minore ci abbia fornito dati personali,
          può contattarci per la rimozione immediata.
        </p>
      </LegalSection>

      <LegalSection title="10. MODIFICHE">
        <p>
          Se questa informativa cambia in modo sostanziale, la data di aggiornamento in cima alla
          pagina verrà aggiornata e le modifiche rilevanti saranno segnalate nell'app.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
