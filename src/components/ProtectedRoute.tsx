import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <p className="font-bebas text-5xl text-[#F44352] tracking-widest animate-pulse">PISOZONE</p>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />
}
