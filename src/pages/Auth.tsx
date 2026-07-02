import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, supabaseReady } from '../lib/supabase'

type LoginForm = { username: string; password: string }
type RegisterForm = { username: string; password: string; confirmPassword: string }
type Tab = 'login' | 'register' | 'recover'

export default function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [recoverStep, setRecoverStep] = useState<'email' | 'code'>('email')
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverCode, setRecoverCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const loginForm = useForm<LoginForm>()
  const registerForm = useForm<RegisterForm>()

  if (user) return <Navigate to="/profile" replace />

  const handleLogin = async (v: LoginForm) => {
    if (!supabaseReady) { setError('Configurazione server mancante — contatta l\'amministratore'); return }
    setSubmitting(true); setError('')
    try {
      const { error: err } = await signIn(v.username, v.password)
      if (err) setError(err.message || 'Username o password non corretti')
      else navigate('/profile')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di connessione al server')
    }
    setSubmitting(false)
  }

  const handleRegister = async (v: RegisterForm) => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(v.username)) {
      setError('Username: 3-20 caratteri, solo lettere, numeri e _')
      return
    }
    if (v.password !== v.confirmPassword) {
      setError('Le password non coincidono')
      return
    }
    if (v.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }
    if (!supabaseReady) { setError('Configurazione server mancante — contatta l\'amministratore'); return }
    setSubmitting(true); setError('')
    try {
      const { error: err } = await signUp(v.username, v.password)
      if (err) {
        setError(err.message.includes('already') ? 'Username già in uso' : err.message)
      } else {
        navigate('/profile')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore di connessione al server')
    }
    setSubmitting(false)
  }

  const openRecover = () => {
    setTab('recover')
    setRecoverStep('email')
    setRecoverEmail('')
    setRecoverCode('')
    setNewPassword('')
    setConfirmNewPassword('')
    setError('')
  }

  const handleSendRecoveryCode = async () => {
    if (!recoverEmail.trim() || submitting) return
    setSubmitting(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(recoverEmail.trim())
    setSubmitting(false)
    if (err) { setError(err.message); return }
    setRecoverStep('code')
  }

  const handleResetPassword = async () => {
    if (submitting) return
    if (newPassword !== confirmNewPassword) { setError('Le password non coincidono'); return }
    if (newPassword.length < 6) { setError('La password deve essere di almeno 6 caratteri'); return }
    setSubmitting(true); setError('')
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: recoverEmail.trim(),
      token: recoverCode.trim(),
      type: 'recovery',
    })
    if (otpError) {
      setSubmitting(false)
      setError('Codice non valido o scaduto. Riprova.')
      return
    }
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })
    setSubmitting(false)
    if (pwError) { setError(pwError.message); return }
    navigate('/')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#0D0D0D' }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="font-bebas text-7xl text-[#F44352] tracking-widest" style={{ lineHeight: 1 }}>
          PISOZONE
        </h1>
        <p className="text-gray-500 text-sm mt-2 tracking-wide">IL TUO TRACKER DI ATTIVITÀ FISICA</p>
      </div>

      <div className="w-full max-w-sm">
        {/* Tab switcher */}
        {tab === 'recover' ? (
          <button
            type="button"
            onClick={() => { setTab('login'); setError('') }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Torna al login
          </button>
        ) : (
          <div className="flex rounded-xl overflow-hidden mb-6 border border-[var(--grey)]">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-[#F44352] text-[white]'
                    : 'text-gray-500 hover:text-white'
                }`}
                style={{ background: tab === t ? '#F44352' : 'var(--grey-dark)' }}
              >
                {t === 'login' ? 'Accedi' : 'Registrati'}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm text-red-400 border border-red-800"
            style={{ background: 'rgba(244,67,82,0.1)' }}>
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Username</label>
              <input
                {...loginForm.register('username', { required: true })}
                className="input-dark"
                placeholder="il_tuo_username"
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                {...loginForm.register('password', { required: true })}
                className="input-dark"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={openRecover}
                className="text-xs text-gray-500 hover:text-[#F44352] transition-colors mt-1.5"
              >
                Password dimenticata?
              </button>
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={submitting}>
              {submitting ? 'Accesso...' : 'Accedi'}
            </button>
          </form>
        ) : tab === 'register' ? (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Username</label>
              <input
                {...registerForm.register('username', { required: true })}
                className="input-dark"
                placeholder="il_tuo_username"
                autoComplete="username"
                autoCapitalize="none"
              />
              <p className="text-xs text-gray-600 mt-1">3–20 caratteri, solo lettere, numeri e _</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                {...registerForm.register('password', { required: true })}
                className="input-dark"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Conferma password</label>
              <input
                type="password"
                {...registerForm.register('confirmPassword', { required: true })}
                className="input-dark"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={submitting}>
              {submitting ? 'Creazione account...' : 'Crea account'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {recoverStep === 'email' ? (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Inserisci l'email di recupero che hai verificato nel tuo profilo. Se corrisponde a
                  un account, riceverai un codice per reimpostare la password.
                </p>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    className="input-dark"
                    placeholder="la-tua-email@esempio.com"
                    autoComplete="email"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendRecoveryCode}
                  disabled={submitting || !recoverEmail.trim()}
                  className="btn-primary w-full mt-2 disabled:opacity-50"
                >
                  {submitting ? 'Invio...' : 'Invia codice'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Controlla la tua email: se l'indirizzo è verificato riceverai un codice a 6 cifre.
                </p>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Codice</label>
                  <input
                    value={recoverCode}
                    onChange={(e) => setRecoverCode(e.target.value)}
                    className="input-dark"
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nuova password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-dark"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Conferma nuova password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input-dark"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={submitting}
                  className="btn-primary w-full mt-2 disabled:opacity-50"
                >
                  {submitting ? 'Verifica...' : 'Reimposta password'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
