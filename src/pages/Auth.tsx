import { useState } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase, supabaseReady } from '../lib/supabase'
import auth from '../lib/i18n/auth'

type LoginForm = { username: string; password: string }
type RegisterForm = { username: string; password: string; confirmPassword: string; accept: boolean }
type Tab = 'login' | 'register' | 'recover'

export default function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Arrivo dalla landing pubblica con "Inizia gratis" (→ /auth?tab=register):
  // apre direttamente la scheda di registrazione invece del login di default.
  const [tab, setTab] = useState<Tab>(() => (searchParams.get('tab') === 'register' ? 'register' : 'login'))
  // Invito diretto (P3-03): username di chi ha condiviso il link. Letto una
  // volta sola al mount, non dallo stato del tab — l'utente potrebbe passare
  // dal login e tornare a registrarsi senza perdere l'invito.
  const inviteUsername = useState(() => searchParams.get('invite'))[0]
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
    if (!supabaseReady) { setError(auth.errors.serverConfigMissing); return }
    setSubmitting(true); setError('')
    try {
      const { error: err } = await signIn(v.username, v.password)
      if (err) setError(err.message || auth.errors.invalidCredentials)
      else navigate('/profile')
    } catch (e) {
      setError(e instanceof Error ? e.message : auth.errors.connectionError)
    }
    setSubmitting(false)
  }

  const handleRegister = async (v: RegisterForm) => {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(v.username)) {
      setError(auth.errors.usernameFormat)
      return
    }
    if (v.password !== v.confirmPassword) {
      setError(auth.errors.passwordMismatch)
      return
    }
    if (v.password.length < 6) {
      setError(auth.errors.passwordTooShort)
      return
    }
    if (!v.accept) {
      setError(auth.errors.mustAcceptTerms)
      return
    }
    if (!supabaseReady) { setError(auth.errors.serverConfigMissing); return }
    setSubmitting(true); setError('')
    try {
      const { error: err } = await signUp(v.username, v.password)
      if (err) {
        setError(err.message.includes('already') ? auth.errors.usernameTaken : err.message)
      } else {
        // PendingInviteHandler consuma questo valore appena la sessione è
        // pronta (signUp non restituisce lo user id sincronicamente qui).
        if (inviteUsername) sessionStorage.setItem('pz-pending-invite', inviteUsername)
        navigate('/profile')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : auth.errors.connectionError)
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
    if (newPassword !== confirmNewPassword) { setError(auth.errors.passwordMismatch); return }
    if (newPassword.length < 6) { setError(auth.errors.passwordTooShort); return }
    setSubmitting(true); setError('')
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: recoverEmail.trim(),
      token: recoverCode.trim(),
      type: 'recovery',
    })
    if (otpError) {
      setSubmitting(false)
      setError(auth.errors.invalidOrExpiredCode)
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
        <p className="text-gray-500 text-sm mt-2 tracking-wide">{auth.subtitle}</p>
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
            {auth.tabs.backToLogin}
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
                {t === 'login' ? auth.tabs.login : auth.tabs.register}
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
              <label className="block text-xs text-gray-400 mb-1.5">{auth.fields.usernameLabel}</label>
              <input
                {...loginForm.register('username', { required: true })}
                className="input-dark"
                placeholder={auth.fields.usernamePlaceholder}
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">{auth.fields.passwordLabel}</label>
              <input
                type="password"
                {...loginForm.register('password', { required: true })}
                className="input-dark"
                placeholder={auth.fields.passwordPlaceholder}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={openRecover}
                className="text-xs text-gray-500 hover:text-[#F44352] transition-colors mt-1.5"
              >
                {auth.login.forgotPassword}
              </button>
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={submitting}>
              {submitting ? auth.login.submitting : auth.login.submit}
            </button>
          </form>
        ) : tab === 'register' ? (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">{auth.fields.usernameLabel}</label>
              <input
                {...registerForm.register('username', { required: true })}
                className="input-dark"
                placeholder={auth.fields.usernamePlaceholder}
                autoComplete="username"
                autoCapitalize="none"
              />
              <p className="text-xs text-gray-600 mt-1">{auth.register.usernameHint}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">{auth.fields.passwordLabel}</label>
              <input
                type="password"
                {...registerForm.register('password', { required: true })}
                className="input-dark"
                placeholder={auth.fields.passwordPlaceholder}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">{auth.fields.confirmPasswordLabel}</label>
              <input
                type="password"
                {...registerForm.register('confirmPassword', { required: true })}
                className="input-dark"
                placeholder={auth.fields.passwordPlaceholder}
                autoComplete="new-password"
              />
            </div>
            {/* target=_blank per non perdere i dati del form aprendo le pagine legali */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...registerForm.register('accept')}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#F44352]"
              />
              <span className="text-xs text-gray-400 leading-relaxed">
                {auth.register.acceptBefore}{' '}
                <a href="/privacy" target="_blank" rel="noopener" className="text-[#F44352] underline">
                  {auth.legalLinks.privacyPolicy}
                </a>{' '}
                {auth.register.acceptMiddle}{' '}
                <a href="/termini" target="_blank" rel="noopener" className="text-[#F44352] underline">
                  {auth.legalLinks.termsOfService}
                </a>
              </span>
            </label>
            <button type="submit" className="btn-primary w-full mt-2" disabled={submitting}>
              {submitting ? auth.register.submitting : auth.register.submit}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {recoverStep === 'email' ? (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {auth.recover.email.intro}
                </p>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">{auth.recover.email.label}</label>
                  <input
                    type="email"
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    className="input-dark"
                    placeholder={auth.recover.email.placeholder}
                    autoComplete="email"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendRecoveryCode}
                  disabled={submitting || !recoverEmail.trim()}
                  className="btn-primary w-full mt-2 disabled:opacity-50"
                >
                  {submitting ? auth.recover.email.submitting : auth.recover.email.submit}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {auth.recover.code.intro}
                </p>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">{auth.recover.code.label}</label>
                  <input
                    value={recoverCode}
                    onChange={(e) => setRecoverCode(e.target.value)}
                    className="input-dark"
                    placeholder={auth.recover.code.placeholder}
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">{auth.fields.newPasswordLabel}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-dark"
                    placeholder={auth.fields.passwordPlaceholder}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">{auth.fields.confirmNewPasswordLabel}</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input-dark"
                    placeholder={auth.fields.passwordPlaceholder}
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={submitting}
                  className="btn-primary w-full mt-2 disabled:opacity-50"
                >
                  {submitting ? auth.recover.code.submitting : auth.recover.code.submit}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
