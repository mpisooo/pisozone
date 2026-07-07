import { useState } from 'react'
import { Mail, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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
          ? "Questa email è già associata a un altro account."
          : 'Invio non riuscito. Controlla l\'indirizzo e riprova.'
      )
      return
    }
    setInfo('Codice inviato! Controlla la tua email e inseriscilo qui sotto.')
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
      setError('Codice non valido o scaduto. Riprova.')
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
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">EMAIL DI RECUPERO</h2>
      </div>

      {realEmail ? (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span className="break-all">{realEmail} verificata</span>
        </div>
      ) : step === 'idle' ? (
        <>
          <p className="text-xs text-gray-500 leading-relaxed">
            Aggiungi e verifica un'email per poter recuperare l'accesso se dimentichi la password.
            Senza un'email verificata il reset password non è possibile.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark flex-1 min-w-0"
              placeholder="la-tua-email@esempio.com"
              autoComplete="email"
              aria-label="Email di recupero"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sending || !email.trim()}
              className="btn-primary px-4 text-sm whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              <span>Invia codice</span>
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
              placeholder="Codice a 6 cifre"
              inputMode="numeric"
              maxLength={6}
              aria-label="Codice di verifica"
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={verifying || !code.trim()}
              className="btn-primary px-4 text-sm whitespace-nowrap disabled:opacity-50"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : 'Verifica'}
            </button>
          </div>
          <button type="button" onClick={handleChangeEmail} className="text-xs text-gray-500 underline">
            Cambia email / invia di nuovo
          </button>
        </>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
