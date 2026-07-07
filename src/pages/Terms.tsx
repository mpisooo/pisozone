import LegalLayout, { LegalSection } from '../components/LegalLayout'

const CONTACT_EMAIL = 'mattiapisati02@gmail.com'

export default function TermsPage() {
  return (
    <LegalLayout title="TERMINI DI SERVIZIO" updated="7 luglio 2026">
      <LegalSection title="1. IL SERVIZIO">
        <p>
          PisoZone è un'app gratuita per il tracciamento personale dell'attività fisica, con
          funzioni social tra amici e meccaniche di gioco (crediti, livelli, medaglie, sfide).
          Creando un account accetti questi termini e la{' '}
          <a href="/privacy" className="text-[#F44352] underline">Privacy Policy</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. ACCOUNT">
        <p>
          Sei responsabile della custodia delle tue credenziali e di ciò che avviene tramite il tuo
          account. L'email di recupero è facoltativa, ma senza di essa non è possibile reimpostare
          la password: in caso di smarrimento l'account non sarà recuperabile.
        </p>
      </LegalSection>

      <LegalSection title="3. USO CORRETTO E CONTENUTI">
        <p>
          Nei contenuti che pubblichi (messaggi, foto profilo, note delle attività, nomi dei gruppi)
          non sono ammessi materiali illeciti, offensivi, discriminatori o che violino diritti di
          terzi. Non è consentito usare l'app per spam, molestie o tentativi di accesso a dati di
          altri utenti. In caso di violazioni l'account può essere sospeso o eliminato.
        </p>
      </LegalSection>

      <LegalSection title="4. CREDITI E OGGETTI VIRTUALI">
        <p>
          Crediti, livelli, medaglie, temi e cornici sono elementi di gioco puramente virtuali: non
          hanno valore monetario, non sono acquistabili con denaro reale, non sono trasferibili né
          rimborsabili, e possono essere modificati o azzerati per esigenze di bilanciamento del
          gioco.
        </p>
      </LegalSection>

      <LegalSection title="5. NON È UN SERVIZIO MEDICO">
        <p>
          PisoZone fornisce stime indicative (ad esempio le calorie, calcolate su valori MET medi, o
          il BMI) che non costituiscono in alcun modo consulenza medica, diagnostica o nutrizionale.
          Prima di iniziare o modificare un programma di allenamento consulta un medico,
          specialmente in presenza di condizioni di salute preesistenti.
        </p>
      </LegalSection>

      <LegalSection title="6. LIMITAZIONE DI RESPONSABILITÀ">
        <p>
          Il servizio è fornito gratuitamente "così com'è", senza garanzie di disponibilità
          continua, assenza di errori o conservazione perpetua dei dati. Ti consigliamo di
          esportare periodicamente i tuoi dati dalla pagina Profilo. Nei limiti consentiti dalla
          legge, il titolare non risponde di danni derivanti dall'uso dell'app o
          dall'indisponibilità del servizio.
        </p>
      </LegalSection>

      <LegalSection title="7. CHIUSURA DELL'ACCOUNT">
        <p>
          Puoi eliminare il tuo account in autonomia in qualsiasi momento dalla pagina Profilo →
          "Privacy e dati": la cancellazione è immediata e irreversibile. Il titolare si riserva di
          sospendere o chiudere account che violino questi termini, previa comunicazione ove
          possibile.
        </p>
      </LegalSection>

      <LegalSection title="8. MODIFICHE AI TERMINI">
        <p>
          Questi termini possono essere aggiornati; le modifiche sostanziali saranno segnalate
          nell'app. L'uso continuato del servizio dopo una modifica ne costituisce accettazione.
        </p>
      </LegalSection>

      <LegalSection title="9. LEGGE APPLICABILE E CONTATTI">
        <p>
          Questi termini sono regolati dalla legge italiana. Per qualsiasi domanda scrivi a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F44352] underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
