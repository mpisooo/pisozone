import LegalLayout, { LegalSection } from '../components/LegalLayout'
import legal from '../lib/i18n/legal'

const CONTACT_EMAIL = 'mattiapisati02@gmail.com'

export default function TermsPage() {
  const t = legal.terms
  return (
    <LegalLayout title={t.title} updated={t.updated}>
      <LegalSection title={t.service.heading}>
        <p>
          {t.service.before}{' '}
          <a href="/privacy" className="text-[#F44352] underline">{t.service.privacyPolicyLinkText}</a>{t.service.after}
        </p>
      </LegalSection>

      <LegalSection title={t.account.heading}>
        <p>
          {t.account.text}
        </p>
      </LegalSection>

      <LegalSection title={t.content.heading}>
        <p>
          {t.content.text}
        </p>
      </LegalSection>

      <LegalSection title={t.virtualItems.heading}>
        <p>
          {t.virtualItems.text}
        </p>
      </LegalSection>

      <LegalSection title={t.notMedical.heading}>
        <p>
          {t.notMedical.text}
        </p>
      </LegalSection>

      <LegalSection title={t.liability.heading}>
        <p>
          {t.liability.text}
        </p>
      </LegalSection>

      <LegalSection title={t.accountClosure.heading}>
        <p>
          {t.accountClosure.text}
        </p>
      </LegalSection>

      <LegalSection title={t.termsChanges.heading}>
        <p>
          {t.termsChanges.text}
        </p>
      </LegalSection>

      <LegalSection title={t.lawAndContacts.heading}>
        <p>
          {t.lawAndContacts.before}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F44352] underline">{CONTACT_EMAIL}</a>{t.lawAndContacts.after}
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
