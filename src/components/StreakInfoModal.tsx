import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Flame, Snowflake, Moon } from 'lucide-react'
import { REST_DAYS_PER_WEEK } from '../lib/recovery'
import { useFocusTrap } from '../hooks/useFocusTrap'
import common from '../lib/i18n/common'
import profileText from '../lib/i18n/profile'

interface Props {
  onClose: () => void
}

// Spiegazione dello streak (roadmap "PisoZone Next" P2-05): stesso pattern
// on-demand di CreditsInfoModal, prima assente per lo streak — aperto dal
// bottone "?" vicino allo streak in PisoRing (Home.tsx).
export default function StreakInfoModal({ onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  const ways = [
    {
      icon: <Flame size={20} className="text-[var(--red)]" />,
      title: profileText.streakInfo.growTitle,
      description: profileText.streakInfo.growDescription,
    },
    {
      icon: <Snowflake size={20} className="text-[var(--red)]" />,
      title: profileText.streakInfo.freezeTitle,
      description: profileText.streakInfo.freezeDescription,
    },
    {
      icon: <Moon size={20} className="text-[var(--red)]" />,
      title: profileText.streakInfo.restTitle,
      description: profileText.streakInfo.restDescription(REST_DAYS_PER_WEEK),
    },
  ]

  return createPortal(
    <div
      className="overlay-fade fixed inset-0 z-[100] flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={profileText.streakInfo.ariaLabel}
        className="sheet-up w-full max-h-[80vh] overflow-y-auto rounded-t-2xl p-4 space-y-4"
        style={{ background: 'var(--grey-dark)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center -mb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--grey-light)' }} />
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bebas text-2xl text-white tracking-wider">{profileText.streakInfo.title}</span>
          <button type="button" onClick={onClose} aria-label={common.close} className="p-1 text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 pb-2">
          {ways.map((w) => (
            <div key={w.title} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--grey)' }}>
              <div className="mt-0.5 shrink-0">{w.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white">{w.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{w.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center">
          {profileText.streakInfo.footer}
        </p>
      </div>
    </div>,
    document.body
  )
}
