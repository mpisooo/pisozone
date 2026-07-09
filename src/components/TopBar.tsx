import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTheme } from '../context/ThemeContext'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { getLevelDef, type ThemeId } from '../lib/levels'
import CreditsInfoModal from './CreditsInfoModal'
import shell from '../lib/i18n/shell'

export default function TopBar() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const { syncProfileTheme } = useTheme()
  const navigate = useNavigate()
  const username: string = (user?.user_metadata?.username as string) || 'Atleta'
  const [open, setOpen] = useState(false)
  const [showCreditsInfo, setShowCreditsInfo] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dropdownRef, open, () => setOpen(false))

  // Sync active_theme from DB to ThemeContext (handles cross-device login)
  useEffect(() => {
    if (profile?.active_theme) {
      syncProfileTheme(profile.active_theme as ThemeId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.active_theme])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const currentLevel = profile?.level ?? 1
  const levelDef = getLevelDef(currentLevel)

  return (
    <header className="topbar fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 safe-top">
      <span
        className="topbar-logo font-bebas text-3xl text-[var(--red)] tracking-widest select-none cursor-pointer"
        onClick={() => navigate('/')}
      >
        PISOZONE
      </span>

      {/* Level badge */}
      {profile && (
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-base leading-none">{levelDef.emoji}</span>
          <span className="text-xs font-medium" style={{ color: levelDef.color }}>
            {shell.topBar.levelPrefix}{currentLevel} {levelDef.title}
          </span>
        </div>
      )}

      {/* Profile menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 focus:outline-none"
          aria-label={shell.topBar.profileMenuLabel}
        >
          {/* Level pill (mobile) */}
          {profile && (
            <span
              className="sm:hidden text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: levelDef.color + '33', color: levelDef.color }}
            >
              {shell.topBar.levelPrefix}{currentLevel}
            </span>
          )}
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[var(--red)] flex-shrink-0" style={{ border: '2px solid var(--red)' }}>
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={username} className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-[white]" />
            )}
          </div>
        </button>

        {open && (
          <div
            ref={dropdownRef}
            aria-label={shell.topBar.profileMenuLabel}
            className="topbar-dropdown absolute right-0 top-11 w-52 rounded-xl overflow-hidden shadow-xl"
          >
            {/* Level info in dropdown */}
            {profile && (
              <>
                <div className="px-4 py-3 flex items-center gap-2">
                  <span className="text-xl">{levelDef.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: levelDef.color }}>
                      {shell.topBar.levelPrefix}{currentLevel} — {levelDef.title}
                    </p>
                    <p className="text-[11px] text-gray-500">{profile.credits} 💎 {shell.topBar.creditsSuffix}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setShowCreditsInfo(true) }}
                    className="p-1 text-gray-500 hover:text-[var(--red)] transition-colors"
                    aria-label={shell.topBar.creditsInfoLabel}
                  >
                    <Info size={16} />
                  </button>
                </div>
                <div className="h-px bg-[var(--grey)]" />
              </>
            )}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-[var(--grey)] transition-colors"
              onClick={() => { setOpen(false); navigate('/profile') }}
            >
              <User size={16} className="text-gray-400" />
              {shell.topBar.profileSettings}
            </button>
            <div className="h-px bg-[var(--grey)]" />
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--red)] hover:bg-[var(--grey)] transition-colors"
              onClick={() => { setOpen(false); signOut() }}
            >
              <LogOut size={16} />
              {shell.topBar.signOut}
            </button>
          </div>
        )}
      </div>

      {showCreditsInfo && <CreditsInfoModal onClose={() => setShowCreditsInfo(false)} />}
    </header>
  )
}
