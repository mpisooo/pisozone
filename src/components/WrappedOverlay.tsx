import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, Share2, Flame } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { haptic } from '../lib/haptics'
import { formatMinutesCompact } from '../lib/stats'
import { buildWrappedShareData, shareCardImage } from '../lib/shareCard'
import type { WrappedData } from '../lib/wrapped'
import wrappedText from '../lib/i18n/wrapped'

// PisoZone Wrapped come "storia": slide a schermo intero, tocco a destra per
// avanzare e a sinistra per tornare indietro. I colori sono FISSI (niente
// CSS var, niente .text-white che in tema chiaro si inverte): come le pagine
// pre-login, il Wrapped ha lo stesso vestito scuro qualunque tema sia attivo.
const ZONE_HEX = ['#3B82F6', '#10B981', '#FBBF24', '#F44352']
const WHITE = '#FFFFFF'
const LIGHT = '#E5E7EB'
const MUTED = '#9CA3AF'
const FAINT = '#6B7280'

interface Props {
  data: WrappedData
  onClose: () => void
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs tracking-[0.3em] font-semibold uppercase" style={{ color: MUTED }}>
      {children}
    </p>
  )
}

interface Slide {
  key: string
  glow: string
  node: ReactNode
}

export default function WrappedOverlay({ data, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, true, onClose)

  // Blocco dello scroll del body finché la storia è aperta (pattern iOS)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  async function handleShare() {
    setSharing(true)
    setShareError(false)
    const filename = data.period.kind === 'month'
      ? `pisozone-wrapped-${data.period.year}-${String(data.period.month).padStart(2, '0')}.png`
      : `pisozone-wrapped-${data.period.year}.png`
    const outcome = await shareCardImage(buildWrappedShareData(data), filename)
    setSharing(false)
    if (outcome === 'failed') {
      setShareError(true)
      haptic('error')
    } else if (outcome !== 'cancelled') {
      haptic('success')
    }
  }

  const slides = useMemo<Slide[]>(() => {
    const kind = data.period.kind
    const out: Slide[] = []

    out.push({
      key: 'intro',
      glow: ZONE_HEX[0],
      node: (
        <>
          <Kicker>{wrappedText.kicker}</Kicker>
          <h2 className="font-bebas text-6xl tracking-wider mt-4 leading-none" style={{ color: WHITE }}>{data.title}</h2>
          <p className="text-sm mt-3" style={{ color: MUTED }}>{wrappedText.intro.subtitle[kind]}</p>
          <p className="text-xs mt-12" style={{ color: FAINT }}>{wrappedText.intro.tapHint}</p>
        </>
      ),
    })

    const deltaPct = data.prevSessions > 0
      ? Math.round(((data.sessions - data.prevSessions) / data.prevSessions) * 100)
      : 0
    out.push({
      key: 'sessions',
      glow: ZONE_HEX[1],
      node: (
        <>
          <Kicker>{wrappedText.sessions.kicker}</Kicker>
          <p className="font-bebas leading-none mt-4" style={{ color: WHITE, fontSize: '8.5rem' }}>{data.sessions}</p>
          <p className="text-lg mt-2" style={{ color: LIGHT }}>{wrappedText.sessions.activeDays(data.activeDays)}</p>
          {deltaPct >= 10 && (
            <p className="text-sm mt-5 font-medium" style={{ color: ZONE_HEX[1] }}>
              {wrappedText.sessions.vsPrev[kind](deltaPct)}
            </p>
          )}
        </>
      ),
    })

    out.push({
      key: 'time',
      glow: ZONE_HEX[2],
      node: (
        <>
          <Kicker>{wrappedText.time.kicker}</Kicker>
          <p className="font-bebas leading-none mt-4" style={{ color: WHITE, fontSize: '6.5rem' }}>
            {formatMinutesCompact(data.minutes)}
          </p>
          {data.calories > 0 && (
            <p className="text-lg mt-3" style={{ color: LIGHT }}>{wrappedText.time.calories(data.calories.toLocaleString('it-IT'))}</p>
          )}
          {data.km > 0 && (
            <p className="text-lg mt-1" style={{ color: LIGHT }}>{wrappedText.time.km(data.km.toLocaleString('it-IT'))}</p>
          )}
        </>
      ),
    })

    if (data.topSport) {
      out.push({
        key: 'sport',
        glow: ZONE_HEX[3],
        node: (
          <>
            <Kicker>{wrappedText.topSport.kicker}</Kicker>
            <p className="font-bebas leading-none mt-4 tracking-wide" style={{ color: WHITE, fontSize: '5.5rem' }}>
              {data.topSport.label}
            </p>
            <p className="text-lg mt-2" style={{ color: LIGHT }}>{wrappedText.topSport.sessions(data.topSport.sessions)}</p>
            {data.distinctSports >= 3 && (
              <p className="text-sm mt-5" style={{ color: MUTED }}>{wrappedText.topSport.distinct(data.distinctSports)}</p>
            )}
          </>
        ),
      })
    }

    if (data.bestStreak >= 2 || data.busiestDay) {
      out.push({
        key: 'records',
        glow: ZONE_HEX[3],
        node: (
          <>
            <Kicker>{wrappedText.records.kicker}</Kicker>
            <div className="mt-8 space-y-7">
              {data.bestStreak >= 2 && (
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>{wrappedText.records.streakLabel}</p>
                  <p className="font-bebas text-6xl leading-tight flex items-center gap-2" style={{ color: WHITE }}>
                    <Flame size={40} style={{ color: ZONE_HEX[3] }} /> {data.bestStreak}
                  </p>
                </div>
              )}
              {data.busiestDay && (
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>{wrappedText.records.busiestLabel}</p>
                  <p className="font-bebas text-4xl leading-tight" style={{ color: WHITE }}>
                    {format(parseISO(data.busiestDay.date), 'd MMMM', { locale: it })} · {formatMinutesCompact(data.busiestDay.minutes)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>{wrappedText.records.longestLabel}</p>
                <p className="font-bebas text-4xl leading-tight" style={{ color: WHITE }}>{formatMinutesCompact(data.longestSessionMin)}</p>
              </div>
            </div>
          </>
        ),
      })
    }

    if (data.topZone) {
      out.push({
        key: 'zones',
        glow: ZONE_HEX[data.topZone.zoneId - 1],
        node: (
          <>
            <Kicker>{wrappedText.zones.kicker}</Kicker>
            <p className="font-bebas text-5xl mt-4 leading-tight" style={{ color: WHITE }}>
              {wrappedText.zones.headline(data.topZone.label)}
            </p>
            <div className="w-full max-w-xs mt-8 space-y-3">
              {data.zones.map((z) => (
                <div key={z.zoneId} className="flex items-center gap-3">
                  <span className="text-xs w-20 text-left flex-shrink-0" style={{ color: MUTED }}>{z.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <div className="h-full rounded-full" style={{ width: `${z.pct}%`, background: ZONE_HEX[z.zoneId - 1] }} />
                  </div>
                  <span className="text-xs w-9 text-right flex-shrink-0 font-semibold" style={{ color: LIGHT }}>{z.pct}%</span>
                </div>
              ))}
            </div>
          </>
        ),
      })
    }

    out.push({
      key: 'final',
      glow: ZONE_HEX[3],
      node: (
        <>
          <Kicker>{wrappedText.final.kicker}</Kicker>
          <h2 className="font-bebas text-5xl tracking-wider mt-3 leading-none" style={{ color: WHITE }}>{data.title}</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 mt-8">
            {buildWrappedShareData(data).stats.map((s) => (
              <div key={s.label}>
                <p className="font-bebas text-4xl leading-none" style={{ color: WHITE }}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: MUTED }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="pointer-events-auto w-full max-w-xs mt-10 space-y-3">
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Share2 size={16} />
              {sharing ? wrappedText.final.sharing : wrappedText.final.share}
            </button>
            {shareError && <p className="text-xs" style={{ color: ZONE_HEX[3] }}>{wrappedText.final.shareError}</p>}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-sm transition-colors"
              style={{ color: MUTED }}
            >
              {wrappedText.close}
            </button>
          </div>
        </>
      ),
    })

    return out
    // sharing/shareError vivono solo nella slide finale ma sono renderizzati
    // dentro le slide: si ricostruisce la lista quando cambiano.
  }, [data, sharing, shareError])

  const isLast = index === slides.length - 1
  const slide = slides[Math.min(index, slides.length - 1)]

  const goForward = () => {
    if (isLast) return
    haptic('light')
    setIndex((i) => Math.min(i + 1, slides.length - 1))
  }
  const goBack = () => {
    if (index === 0) return
    haptic('light')
    setIndex((i) => Math.max(i - 1, 0))
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={wrappedText.ariaLabel}
      className="overlay-fade fixed inset-0 z-[120] flex flex-col overflow-hidden"
      style={{ background: '#0B0B0E' }}
    >
      {/* Bagliore della slide corrente, lungo lo spettro Zone */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${slide.glow}2E, transparent 62%)`,
          transition: 'background 0.5s ease',
        }}
      />

      {/* Avanzamento a segmenti, stile storia */}
      <div className="relative flex gap-1.5 px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
        {slides.map((s, i) => (
          <div
            key={s.key}
            className="flex-1 h-1 rounded-full"
            style={{ background: i <= index ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)' }}
          />
        ))}
      </div>

      <div className="relative z-20 flex justify-end px-3 pt-1.5">
        <button type="button" onClick={onClose} aria-label={wrappedText.close} className="p-2" style={{ color: MUTED }}>
          <X size={24} />
        </button>
      </div>

      {/* Zone di tocco invisibili: un terzo a sinistra per tornare indietro,
          il resto per avanzare. I controlli della slide finale stanno sopra
          (z-20), quindi restano cliccabili. */}
      {index > 0 && (
        <button
          type="button"
          onClick={goBack}
          aria-label={wrappedText.back}
          className="absolute inset-y-0 left-0 w-1/3 z-10"
          style={{ opacity: 0 }}
        />
      )}
      {!isLast && (
        <button
          type="button"
          onClick={goForward}
          aria-label={wrappedText.forward}
          className="absolute inset-y-0 right-0 w-2/3 z-10"
          style={{ opacity: 0 }}
        />
      )}

      {/* Il contenuto sta SOPRA le zone di tocco (z-30) ma è pointer-events-none:
          i tap sul testo attraversano e raggiungono le zone, mentre i bottoni
          della slide finale riattivano gli eventi con pointer-events-auto.
          (celebration-pop lascia un transform residuo che crea uno stacking
          context: uno z-index sui soli bottoni non basterebbe.) */}
      <div
        key={slide.key}
        className="celebration-pop pointer-events-none relative z-30 flex-1 min-h-0 flex flex-col items-center justify-center text-center px-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
      >
        {slide.node}
      </div>
    </div>,
    document.body,
  )
}
