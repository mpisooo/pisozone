import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import ActivityIcon from '../components/ActivityIcon'
import landing from '../lib/i18n/landing'
import type { ActivityType } from '../types'

// Sagoma piccola e varia del catalogo sport: reali (stesse icone usate in
// tutta l'app), non uno screenshot — coerente con "niente prova sociale o
// contenuto inventato" su questa pagina.
const SHOWCASE_SPORTS: ActivityType[] = ['corsa', 'bici', 'palestra', 'nuoto', 'arrampicata', 'sci_alpino', 'calcio', 'tennis']

// Landing pubblica ("PisoZone Next", pilastro Landing — P1-04): sostituisce,
// per chi non è autenticato, il redirect diretto a /auth su "/" (vedi
// components/ProtectedRoute.tsx). Pagina pre-login come Auth/Privacy/Termini:
// sfondo fisso #0D0D0D indipendente dal tema salvato (stessa eccezione
// dichiarata di quelle pagine), testo su scala grigia Tailwind fissa (mai
// var(--color-text), che su un profilo con tema chiaro salvato sarebbe
// illeggibile su questo sfondo). Nessuna prova sociale o screenshot inventati.
export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: '#0D0D0D' }}
    >
      <header
        className="flex items-center justify-between px-5 max-w-5xl mx-auto"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 18px)', paddingBottom: 18 }}
      >
        <span className="font-bebas text-2xl text-[#F44352] tracking-widest">PISOZONE</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 hidden sm:inline">{landing.header.existingAccount}</span>
          <Link to="/auth" className="text-[white] font-semibold hover:text-[#F44352] transition-colors">
            {landing.header.login}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 pt-8 pb-14 text-center overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(120% 60% at 50% 0%, rgba(244,67,82,0.16), transparent 70%)' }}
        />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#F44352] uppercase">{landing.hero.kicker}</p>
          <h1 className="font-bebas text-5xl sm:text-6xl text-[white] tracking-wide mt-4 leading-[1.05]">
            {landing.hero.title}
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mt-5 max-w-lg mx-auto">
            {landing.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link to="/auth?tab=register" className="btn-primary w-full sm:w-auto text-center">
              {landing.hero.ctaPrimary}
            </Link>
            <a
              href="#come-funziona"
              className="btn-secondary w-full sm:w-auto text-center"
              style={{ borderColor: 'rgba(255,255,255,0.18)', color: '#e5e5e7' }}
            >
              {landing.hero.ctaSecondary}
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-10">
            {SHOWCASE_SPORTS.map((type) => (
              <div
                key={type}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ActivityIcon type={type} size={22} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="px-5 py-14" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="font-bebas text-3xl text-[white] tracking-wider text-center mb-10">{landing.how.heading}</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {landing.how.steps.map((step, i) => (
              <div key={step.title} className="text-center sm:text-left">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bebas text-lg mx-auto sm:mx-0 mb-3"
                  style={{ background: 'rgba(244,67,82,0.14)', color: '#F44352' }}
                >
                  {i + 1}
                </div>
                <h3 className="text-[white] font-semibold text-base">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mt-1.5">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefici */}
      <section className="px-5 py-14" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bebas text-3xl text-[white] tracking-wider text-center mb-10">{landing.benefits.heading}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {landing.benefits.items.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <h3 className="text-[white] font-semibold text-[15px]">{b.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mt-1.5">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="px-5 py-14" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-bebas text-3xl text-[white] tracking-wider mb-4">{landing.privacy.heading}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{landing.privacy.body}</p>
          <Link to="/privacy" className="inline-block text-[#F44352] text-sm font-semibold mt-4 hover:underline">
            {landing.privacy.link}
          </Link>
        </div>
      </section>

      {/* Installazione */}
      <section className="px-5 py-14" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-bebas text-3xl text-[white] tracking-wider text-center mb-10">{landing.install.heading}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[landing.install.ios, landing.install.android].map((step) => (
              <div
                key={step.title}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <h3 className="text-[white] font-semibold text-[15px]">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mt-1.5">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — stesso pattern <details>/<summary> nativo di Guide.tsx */}
      <section className="px-5 py-14" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-bebas text-3xl text-[white] tracking-wider text-center mb-8">{landing.faq.heading}</h2>
          <div className="space-y-2.5">
            {landing.faq.items.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
                  <span className="text-[white] font-medium text-sm flex-1">{f.q}</span>
                  <ChevronDown size={16} className="text-gray-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="px-4 pb-4 text-gray-400 text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer
        className="px-5 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-5xl mx-auto text-xs text-gray-500"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
      >
        <span>{landing.footer.rights}</span>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-[white] transition-colors">{landing.footer.privacy}</Link>
          <Link to="/termini" className="hover:text-[white] transition-colors">{landing.footer.terms}</Link>
          <Link to="/auth" className="hover:text-[white] transition-colors">{landing.footer.login}</Link>
        </div>
      </footer>
    </div>
  )
}
