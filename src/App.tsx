import { useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { UnreadProvider } from './context/UnreadContext'
import ProtectedRoute from './components/ProtectedRoute'
import TopBar from './components/TopBar'
import Navbar from './components/Navbar'
import SplashScreen from './components/SplashScreen'
import PageLoader from './components/PageLoader'
import AuthPage from './pages/Auth'
import HomePage from './pages/Home'

const ProfilePage    = lazy(() => import('./pages/Profile'))
const LogPage        = lazy(() => import('./pages/Log'))
const CalendarPage   = lazy(() => import('./pages/Calendar'))
const StatsPage      = lazy(() => import('./pages/Stats'))
const MedalsPage     = lazy(() => import('./pages/Medals'))
const SocialPage     = lazy(() => import('./pages/Social'))
const ChallengesPage = lazy(() => import('./pages/Challenges'))

function AppLayout() {
  return (
    <UnreadProvider>
      <div className="app-layout">
        <TopBar />
        <main className="app-main">
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
        </main>
        <Navbar />
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
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
