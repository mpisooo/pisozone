import { useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProfileProvider } from './context/ProfileContext'
import { ToastProvider } from './context/ToastContext'
import { UnreadProvider } from './context/UnreadContext'
import ProtectedRoute from './components/ProtectedRoute'
import ConsentGate from './components/ConsentGate'
import TopBar from './components/TopBar'
import Navbar from './components/Navbar'
import SplashScreen from './components/SplashScreen'
import PageLoader from './components/PageLoader'
import ErrorBoundary from './components/ErrorBoundary'
import AuthPage from './pages/Auth'
import HomePage from './pages/Home'

const ProfilePage    = lazy(() => import('./pages/Profile'))
const PrivacyPage    = lazy(() => import('./pages/Privacy'))
const TermsPage      = lazy(() => import('./pages/Terms'))
const LogPage        = lazy(() => import('./pages/Log'))
const CalendarPage   = lazy(() => import('./pages/Calendar'))
const StatsPage      = lazy(() => import('./pages/Stats'))
const MedalsPage     = lazy(() => import('./pages/Medals'))
const SocialPage     = lazy(() => import('./pages/Social'))
const ChallengesPage = lazy(() => import('./pages/Challenges'))

function AppLayout() {
  const location = useLocation()
  return (
    <UnreadProvider>
      <div className="app-layout">
        <TopBar />
        <main className="app-main">
          {/* key sulla route: se una pagina va in errore, navigando altrove il boundary si resetta */}
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"            element={<HomePage />} />
                <Route path="/profile"     element={<ProfilePage />} />
                <Route path="/log"         element={<LogPage />} />
                <Route path="/calendar"    element={<CalendarPage />} />
                <Route path="/stats"       element={<StatsPage />} />
                <Route path="/medals"      element={<MedalsPage />} />
                <Route path="/social"      element={<SocialPage />} />
                <Route path="/challenges"  element={<ChallengesPage />} />
                <Route path="*"            element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Navbar />
        {/* Blocca gli utenti pre-esistenti finché non accettano Privacy/Termini */}
        <ConsentGate />
      </div>
    </UnreadProvider>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('splashShown')
  )

  const handleSplashDone = () => {
    sessionStorage.setItem('splashShown', '1')
    setShowSplash(false)
  }

  return (
    <ThemeProvider>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            {/* Pagine legali pubbliche: consultabili anche prima della registrazione */}
            <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>} />
            <Route path="/termini" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <ToastProvider>
                    <ProfileProvider>
                      <AppLayout />
                    </ProfileProvider>
                  </ToastProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
