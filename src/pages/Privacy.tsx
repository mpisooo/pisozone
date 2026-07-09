import LegalLayout, { LegalSection } from '../components/LegalLayout'
import legal from '../lib/i18n/legal'

const CONTACT_EMAIL = 'mattiapisati02@gmail.com'

export default function PrivacyPage() {
  const p = legal.privacy
  return (
    <LegalLayout title={p.title} updated={p.updated}>
      <LegalSection title={p.controller.heading}>
        <p>
          {p.controller.before}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F44352] underline">{CONTACT_EMAIL}</a>{p.controller.after}
        </p>
      </LegalSection>

      <LegalSection title={p.dataCollected.heading}>
        <p>{p.dataCollected.intro}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>{p.dataCollected.account.label}</strong>{p.dataCollected.account.text}</li>
          <li><strong>{p.dataCollected.profile.label}</strong>{p.dataCollected.profile.text}</li>
          <li><strong>{p.dataCollected.activities.label}</strong>{p.dataCollected.activities.text}</li>
          <li><strong>{p.dataCollected.social.label}</strong>{p.dataCollected.social.text}</li>
          <li><strong>{p.dataCollected.gamification.label}</strong>{p.dataCollected.gamification.text}</li>
          <li><strong>{p.dataCollected.push.label}</strong>{p.dataCollected.push.text}</li>
          <li><strong>{p.dataCollected.technical.label}</strong>{p.dataCollected.technical.text}</li>
        </ul>
        <p>{p.dataCollected.outro}</p>
      </LegalSection>

      <LegalSection title={p.purpose.heading}>
        <p>{p.purpose.text}</p>
      </LegalSection>

      <LegalSection title={p.storage.heading}>
        <p>{p.storage.intro}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>{p.storage.supabase.label}</strong>{p.storage.supabase.before}<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#F44352] underline">{p.storage.privacyPolicyLinkText}</a>{p.storage.supabase.after}</li>
          <li><strong>{p.storage.vercel.label}</strong>{p.storage.vercel.before}<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#F44352] underline">{p.storage.privacyPolicyLinkText}</a>{p.storage.vercel.after}</li>
          <li><strong>{p.storage.sentry.label}</strong>{p.storage.sentry.before}<a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-[#F44352] underline">{p.storage.privacyPolicyLinkText}</a>{p.storage.sentry.after}</li>
        </ul>
        <p>{p.storage.outro}</p>
      </LegalSection>

      <LegalSection title={p.whoSeesWhat.heading}>
        <p>
          {p.whoSeesWhat.text}
        </p>
      </LegalSection>

      <LegalSection title={p.retention.heading}>
        <p>
          {p.retention.text}
        </p>
      </LegalSection>

      <LegalSection title={p.rights.heading}>
        <p>{p.rights.intro}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>{p.rights.export.label}</strong>{p.rights.export.text}</li>
          <li><strong>{p.rights.delete.label}</strong>{p.rights.delete.text}</li>
          <li><strong>{p.rights.rectify.label}</strong>{p.rights.rectify.text}</li>
        </ul>
        <p>
          {p.rights.exerciseBefore}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F44352] underline">{CONTACT_EMAIL}</a>
          {p.rights.exerciseMiddle}
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-[#F44352] underline">garanteprivacy.it</a>
          {p.rights.exerciseAfter}
        </p>
      </LegalSection>

      <LegalSection title={p.cookies.heading}>
        <p>
          {p.cookies.text}
        </p>
      </LegalSection>

      <LegalSection title={p.minors.heading}>
        <p>
          {p.minors.text}
        </p>
      </LegalSection>

      <LegalSection title={p.changes.heading}>
        <p>
          {p.changes.text}
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
