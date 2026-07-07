import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Props {
  title: string
  updated: string
  children: ReactNode
}

// Layout per le pagine legali pubbliche (/privacy, /termini): raggiungibili
// anche da utenti non loggati, quindi niente TopBar/Navbar (vivono dentro i
// context autenticati). I fallback nelle CSS var coprono il primo paint.
export default function LegalLayout({ title, updated, children }: Props) {
  return (
    <div
      className="min-h-screen px-5 py-8"
      style={{ background: 'var(--black, #0D0D0D)', color: 'var(--color-text, #f5f5f5)' }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Torna a PisoZone
        </Link>
        <h1 className="font-bebas text-4xl tracking-widest text-[#F44352]">{title}</h1>
        <p className="text-xs text-gray-500 mt-1 mb-8">Ultimo aggiornamento: {updated}</p>
        <div className="space-y-7 pb-10">{children}</div>
      </div>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-bebas text-xl tracking-wider text-white">{title}</h2>
      <div className="text-sm text-gray-300 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}
