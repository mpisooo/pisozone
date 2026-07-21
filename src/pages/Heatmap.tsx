import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchAllUserRoutes } from '../lib/activityRoutes'
import { buildHeatmapRoutes } from '../lib/heatmap'
import HeatmapMap from '../components/HeatmapMap'
import EmptyState from '../components/EmptyState'
import heatmapText from '../lib/i18n/heatmap'
import type { RoutePoint } from '../types'

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY

// Heatmap personale (roadmap v4, pilastro 02): tutti i percorsi GPS mai
// registrati, sovrapposti su una sola mappa. Mai pubblica — la query filtra
// solo sull'utente corrente, nessun percorso altrui può comparire qui.
export default function HeatmapPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<RoutePoint[][] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchAllUserRoutes(user.id).then(({ rows, error }) => {
      if (cancelled) return
      if (error) {
        setLoadFailed(true)
        return
      }
      setRoutes(buildHeatmapRoutes(rows))
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const mapAvailable = Boolean(MAPTILER_KEY) && navigator.onLine

  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">{heatmapText.pageTitle}</span>
        <div className="header-accent" />
        <p className="text-xs text-gray-500 mt-2">{heatmapText.subtitle}</p>
        <p className="text-xs text-gray-600 mt-1">🔒 {heatmapText.privacyNote}</p>
      </div>

      {routes === null && !loadFailed && (
        <div className="skeleton rounded-xl" style={{ height: 420 }} />
      )}

      {loadFailed && (
        <div className="card py-10">
          <EmptyState icon="bolt" title={heatmapText.loadError.title} hint={heatmapText.loadError.hint} />
        </div>
      )}

      {routes !== null && !loadFailed && routes.length === 0 && (
        <div className="card py-10">
          <EmptyState
            icon="rocket"
            title={heatmapText.emptyState.title}
            hint={heatmapText.emptyState.hint}
            cta={heatmapText.emptyState.cta}
            onCta={() => navigate('/log')}
          />
        </div>
      )}

      {routes !== null && !loadFailed && routes.length > 0 && (
        <>
          <p className="text-xs text-gray-400">{heatmapText.routesCount(routes.length)}</p>
          {mapAvailable ? (
            <div className="card !p-0 overflow-hidden">
              <HeatmapMap routes={routes} />
            </div>
          ) : (
            <div className="card py-10">
              <EmptyState icon="bolt" title={heatmapText.mapUnavailable.title} hint={heatmapText.mapUnavailable.hint} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
