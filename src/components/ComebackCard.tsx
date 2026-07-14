import { useNavigate } from 'react-router-dom'
import { Sunrise } from 'lucide-react'
import home from '../lib/i18n/home'

// Rientro morbido dopo un'assenza (roadmap v2, pilastro 04): niente sensi di
// colpa, un invito concreto a ripartire con poco. Compare in Home quando
// isComeback (lib/comeback.ts) è vero.
export default function ComebackCard({ days }: { days: number }) {
  const navigate = useNavigate()
  return (
    <div className="card border border-amber-500/30">
      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-amber-400"
          style={{ background: 'rgba(251,191,36,0.12)' }}
        >
          <Sunrise size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-300 text-sm">{home.comeback.title}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{home.comeback.body(days)}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{home.comeback.hint}</p>
          <button
            type="button"
            className="btn-primary text-xs px-4 py-1.5 mt-2.5"
            onClick={() => navigate('/log', { viewTransition: true })}
          >
            {home.comeback.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
