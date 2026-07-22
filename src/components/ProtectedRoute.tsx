import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LandingPage from '../pages/Landing'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <p className="font-bebas text-5xl text-[var(--red)] tracking-widest animate-pulse">PISOZONE</p>
      </div>
    )
  }

  if (user) return <>{children}</>
  // La home pubblica ("/") mostra la landing invece di rimbalzare subito su
  // /auth — ogni altra rotta protetta (es. /log, /calendar) continua a
  // richiedere il login com'era prima.
  if (location.pathname === '/') return <LandingPage />
  return <Navigate to="/auth" replace />
}
