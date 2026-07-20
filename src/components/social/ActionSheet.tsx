import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import social from '../../lib/i18n/social'

interface Props {
  onClose: () => void
  label?: string
  children: ReactNode
}

// ── Action Sheet (Portal) ─────────────────────────────────────────────────────
// Stesso pattern di accessibilità di ActivityEditModal: focus trap, Esc, dialog
export default function ActionSheet({ onClose, label = social.shared.actionSheetDefaultLabel, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)
  return createPortal(
    <>
      <div className="overlay-fade fixed inset-0 bg-black/60 z-[70]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="sheet-up fixed bottom-0 left-0 right-0 z-[71] rounded-t-2xl overflow-hidden"
        style={{ background: 'var(--grey-dark)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {children}
      </div>
    </>,
    document.body
  )
}
