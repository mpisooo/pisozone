import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import shell from '../lib/i18n/shell'

// Foto a schermo intero (feed). Stesso pattern accessibile di ActivityEditModal:
// focus trap, Esc, role="dialog"; chiude anche col tap sullo sfondo.
export default function PhotoLightbox({
  url, alt, onClose,
}: { url: string; alt: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="overlay-fade fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      {/* La X sta sotto la status bar dell'iPhone (safe area), mai sovrapposta a orologio/batteria */}
      <button
        type="button"
        onClick={onClose}
        aria-label={shell.photoLightbox.close}
        className="absolute right-4 p-2.5 rounded-full text-gray-300 hover:text-white"
        style={{ background: 'rgba(255,255,255,0.12)', top: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <X size={22} />
      </button>
      <img
        src={url}
        alt={alt}
        className="modal-pop max-w-full max-h-full object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  )
}
