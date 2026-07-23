import { useState } from 'react'
import { ChevronDown, Share2 } from 'lucide-react'
import { getZoneByPercent } from '../lib/zones'
import { factorTier, type ReadinessResult } from '../lib/readiness'
import { buildReadinessShareData, shareCardImage } from '../lib/shareCard'
import { haptic } from '../lib/haptics'
import AnimatedNumber from './AnimatedNumber'
import home from '../lib/i18n/home'
import shareText from '../lib/i18n/share'

interface Props {
  readiness: ReadinessResult | null
}

// Punteggio di Prontezza (roadmap v4, pilastro 01, FLAGSHIP): un solo numero
// 0-100 colorato con la stessa palette Zone di tutta l'app (blu→rosso), con
// il consiglio in tre parole sotto. Nessun grafico: il colpo d'occhio è il
// punto, come il PisoRing.
// Spiegabilità (P3-04, roadmap "PisoZone Next"): stessi 4 fattori esposti già
// dal punteggio, mai pesi/formule — solo un'etichetta a 3 livelli (o il
// motivo per cui manca), stesso colore Zone del punteggio principale.
const FACTOR_KEYS = ['load', 'sleep', 'rpe', 'rest'] as const

export default function ReadinessCard({ readiness }: Props) {
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  if (!readiness) {
    return (
      <div className="card text-center py-5">
        <p className="text-sm font-medium text-gray-400">{home.readiness.emptyTitle}</p>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{home.readiness.emptyHint}</p>
      </div>
    )
  }

  const zone = getZoneByPercent(readiness.score)
  const adviceText =
    readiness.advice === 'push' ? home.readiness.advicePush
    : readiness.advice === 'steady' ? home.readiness.adviceSteady
    : home.readiness.adviceRest

  // Card condivisibile (roadmap v5, pilastro 03): la prontezza era l'unica
  // flagship v4 mai diventata un'immagine da mostrare, come attività/Wrapped.
  const handleShare = async () => {
    setSharing(true)
    setShareError(false)
    const data = buildReadinessShareData(readiness, adviceText, {
      load: home.readiness.factorLoad,
      sleep: home.readiness.factorSleep,
      rpe: home.readiness.factorRpe,
      rest: home.readiness.factorRest,
    })
    const outcome = await shareCardImage(data, 'pisozone-prontezza.png')
    setSharing(false)
    if (outcome === 'failed') setShareError(true)
    else if (outcome !== 'cancelled') haptic('success')
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bebas text-xl tracking-wider" style={{ color: zone.cssVar }}>{home.readiness.cardTitle}</h2>
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          aria-label={shareText.readinessButton}
          className="p-1.5 -mr-1.5 text-gray-500 hover:text-white disabled:opacity-40 tap flex-shrink-0"
        >
          <Share2 size={16} />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-bebas text-5xl leading-none flex-shrink-0" style={{ color: zone.cssVar }}>
          <AnimatedNumber value={readiness.score} />
          <span className="text-base text-gray-500">{home.readiness.scoreSuffix}</span>
        </span>
        <p className="text-sm text-gray-300 leading-snug flex-1">{adviceText}</p>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">{home.readiness.hint}</p>
      {shareError && <p className="text-[11px]" style={{ color: 'var(--zone-4)' }}>{shareText.error}</p>}

      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-semibold tap"
        style={{ color: 'var(--red)' }}
      >
        {showDetail ? home.readiness.detailHide : home.readiness.detailToggle}
        <ChevronDown size={12} style={{ transform: showDetail ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast)' }} />
      </button>

      {showDetail && (
        <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--grey-light)' }}>
          {FACTOR_KEYS.map((key) => {
            const value = readiness.factors[key]
            const tier = factorTier(value)
            const label = home.readiness[`factor${key[0].toUpperCase()}${key.slice(1)}` as 'factorLoad' | 'factorSleep' | 'factorRpe' | 'factorRest']
            const missingReason = home.readiness[`missing${key[0].toUpperCase()}${key.slice(1)}` as 'missingLoad' | 'missingSleep' | 'missingRpe' | 'missingRest']
            const tierLabel =
              tier === 'good' ? home.readiness.tierGood
              : tier === 'ok' ? home.readiness.tierOk
              : tier === 'low' ? home.readiness.tierLow
              : home.readiness.tierMissing
            const color = tier === 'missing' ? 'var(--grey-light)' : getZoneByPercent(value ?? 0).cssVar
            return (
              <div key={key} className="flex items-start justify-between gap-3 text-xs pt-1 first:pt-0">
                <span className="text-gray-400 flex-shrink-0">{label}</span>
                <span className="text-right">
                  <span className="font-semibold" style={{ color }}>{tierLabel}</span>
                  {tier === 'missing' && (
                    <span className="block text-gray-600 text-[10.5px] mt-0.5 max-w-[220px] leading-snug">{missingReason}</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
