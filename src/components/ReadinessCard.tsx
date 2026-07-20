import { getZoneByPercent } from '../lib/zones'
import type { ReadinessResult } from '../lib/readiness'
import AnimatedNumber from './AnimatedNumber'
import home from '../lib/i18n/home'

interface Props {
  readiness: ReadinessResult | null
}

// Punteggio di Prontezza (roadmap v4, pilastro 01, FLAGSHIP): un solo numero
// 0-100 colorato con la stessa palette Zone di tutta l'app (blu→rosso), con
// il consiglio in tre parole sotto. Nessun grafico: il colpo d'occhio è il
// punto, come il PisoRing.
export default function ReadinessCard({ readiness }: Props) {
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

  return (
    <div className="card space-y-3">
      <h2 className="font-bebas text-xl tracking-wider" style={{ color: zone.cssVar }}>{home.readiness.cardTitle}</h2>
      <div className="flex items-center gap-4">
        <span className="font-bebas text-5xl leading-none flex-shrink-0" style={{ color: zone.cssVar }}>
          <AnimatedNumber value={readiness.score} />
          <span className="text-base text-gray-500">{home.readiness.scoreSuffix}</span>
        </span>
        <p className="text-sm text-gray-300 leading-snug flex-1">{adviceText}</p>
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed">{home.readiness.hint}</p>
    </div>
  )
}
