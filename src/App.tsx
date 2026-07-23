import { useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProfileProvider } from './context/ProfileContext'
import { ToastProvider } from './context/ToastContext'
import { UnreadProvider } from './context/UnreadContext'
import { ChallengesBadgeProvider } from './context/ChallengesBadgeContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { useLanguage } from './lib/i18n/language'
import ProtectedRoute from './components/ProtectedRoute'
import ConsentGate from './components/ConsentGate'
import OnboardingTour from './components/OnboardingTour'
import WhatsNewOverlay from './components/WhatsNewOverlay'
import TopBar from './components/TopBar'
import Navbar from './components/Navbar'
import SplashScreen from './components/SplashScreen'
import PageLoader from './components/PageLoader'
import ErrorBoundary from './components/ErrorBoundary'
import UpdateAvailableToast from './components/UpdateAvailableToast'
import PendingInviteHandler from './components/PendingInviteHandler'
import AuthPage from './pages/Auth'
import HomePage from './pages/Home'

const ProfilePage    = lazy(() => import('./pages/Profile'))
const SettingsPage   = lazy(() => import('./pages/Settings'))
const PrivacyPage    = lazy(() => import('./pages/Privacy'))
const TermsPage      = lazy(() => import('./pages/Terms'))
const LogPage        = lazy(() => import('./pages/Log'))
const CalendarPage   = lazy(() => import('./pages/Calendar'))
const StatsPage      = lazy(() => import('./pages/Stats'))
const MedalsPage     = lazy(() => import('./pages/Medals'))
const SocialPage     = lazy(() => import('./pages/Social'))
const ChallengesPage = lazy(() => import('./pages/Challenges'))
const PlansPage      = lazy(() => import('./pages/Plans'))
const GuidePage      = lazy(() => import('./pages/Guide'))
const HeatmapPage    = lazy(() => import('./pages/Heatmap'))
const SegmentsPage   = lazy(() => import('./pages/Segments'))
const RoutinesPage   = lazy(() => import('./pages/Routines'))

function AppLayout() {
  const location = useLocation()
  // Il cambio lingua (roadmap v3, pilastro 04) non passa per un hook
  // useStrings() in ogni pagina: i namespace restano import statici, ma il
  // loro default export è un Proxy "vivo" (lib/i18n/proxy.ts) che legge la
  // lingua corrente a ogni accesso. Perché le pagine già montate mostrino
  // subito il nuovo testo senza reload manuale, il sottoalbero visibile va
  // rimontato al cambio — da qui la key sul div, non su AppLayout stesso
  // (badge/notifiche restano fuori, niente riconnessione realtime).
  const language = useLanguage()
  return (
    <UnreadProvider>
    <ChallengesBadgeProvider>
    <NotificationsProvider>
      <div className="app-layout" key={language}>
        <TopBar />
        <main className="app-main">
          {/* key sulla route: se una pagina va in errore, navigando altrove il boundary si resetta */}
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"            element={<HomePage />} />
                <Route path="/profile"     element={<ProfilePage />} />
                <Route path="/settings"    element={<SettingsPage />} />
                <Route path="/log"         element={<LogPage />} />
                <Route path="/calendar"    element={<CalendarPage />} />
                <Route path="/stats"       element={<StatsPage />} />
                <Route path="/medals"      element={<MedalsPage />} />
                <Route path="/social"      element={<SocialPage />} />
                <Route path="/challenges"  element={<ChallengesPage />} />
                <Route path="/plans"       element={<PlansPage />} />
                <Route path="/guide"       element={<GuidePage />} />
                <Route path="/heatmap"     element={<HeatmapPage />} />
                <Route path="/segments"    element={<SegmentsPage />} />
                <Route path="/routines"    element={<RoutinesPage />} />
                <Route path="*"            element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Navbar />
        {/* Blocca gli utenti pre-esistenti finché non accettano Privacy/Termini */}
        <ConsentGate />
        {/* Tour di benvenuto al primo accesso (solo nuovi account, v25) */}
        <OnboardingTour />
        {/* Annuncio one-shot delle novità per chi usa già l'app (v35) */}
        <WhatsNewOverlay />
        {/* Avviso di nuova build già attiva (P0-08, roadmap "PisoZone Next") */}
        <UpdateAvailableToast />
        {/* Consuma l'invito diretto in sessionStorage, se presente (P3-03) */}
        <PendingInviteHandler />
      </div>
    </NotificationsProvider>
    </ChallengesBadgeProvider>
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
