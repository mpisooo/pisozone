import { useState } from 'react'
import { Mail, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import profileText from '../lib/i18n/profile'

const FAKE_EMAIL_SUFFIX = '@pisozone.local'

// L'account usa un'email fittizia (username@pisozone.local) per l'auth di Supabase,
// quindi il reset password nativo via email non può funzionare finché l'utente non
// collega e verifica un'email reale. Il cambio email di Supabase Auth gestisce
// l'invio del codice; qui lo verifichiamo con verifyOtp (type: 'email_change').
export default function RecoveryEmailCard() {
  const { user } = useAuth()
  const realEmail = user?.email && !user.email.endsWith(FAKE_EMAIL_SUFFIX) ? user.email : null

  const [step, setStep] = useState<'idle' | 'code'>('idle')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSendCode = async () => {
    if (!email.trim() || sending) return
    setSending(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ email: email.trim() })
    setSending(false)
    if (err) {
      setError(
        err.message.toLowerCase().includes('already')
          ? profileText.recoveryEmail.alreadyAssociated
          : profileText.recoveryEmail.sendFailed
      )
      return
    }
    setInfo(profileText.recoveryEmail.codeSentInfo)
    setStep('code')
  }

  const handleVerifyCode = async () => {
    if (!code.trim() || verifying) return
    setVerifying(true)
    setError('')
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email_change',
    })
    setVerifying(false)
    if (err) {
      setError(profileText.recoveryEmail.invalidCode)
      return
    }
    setInfo('')
    setStep('idle')
    setCode('')
    setEmail('')
  }

  const handleChangeEmail = () => {
    setStep('idle')
    setInfo('')
    setError('')
    setCode('')
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-[var(--red)]" />
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.recoveryEmail.title}</h2>
      </div>

      {realEmail ? (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span className="break-all">{profileText.recoveryEmail.verifiedSuffix(realEmail)}</span>
        </div>
      ) : step === 'idle' ? (
        <>
          <p className="text-xs text-gray-500 leading-relaxed">
            {profileText.recoveryEmail.introHint}
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark flex-1 min-w-0"
              placeholder={profileText.recoveryEmail.emailPlaceholder}
              autoComplete="email"
              aria-label={profileText.recoveryEmail.emailAriaLabel}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sending || !email.trim()}
              className="btn-primary px-4 text-sm whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              <span>{profileText.recoveryEmail.sendCodeButton}</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-500 leading-relaxed">{info}</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-dark flex-1 min-w-0"
              placeholder={profileText.recoveryEmail.codePlaceholder}
              inputMode="numeric"
              maxLength={6}
              aria-label={profileText.recoveryEmail.codeAriaLabel}
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={verifying || !code.trim()}
              className="btn-primary px-4 text-sm whitespace-nowrap disabled:opacity-50"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : profileText.recoveryEmail.verifyButton}
            </button>
          </div>
          <button type="button" onClick={handleChangeEmail} className="text-xs text-gray-500 underline">
            {profileText.recoveryEmail.changeEmailButton}
          </button>
        </>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
