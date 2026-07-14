import { useMemo } from 'react'
import { buildInsights } from '../lib/insights'
import insightsText from '../lib/i18n/insights'
import type { Activity } from '../types'

// Card "I tuoi insight" (roadmap v2, pilastro 04): osservazioni personali
// derivate da tutte le attività — indipendente dal filtro periodo della
// pagina Statistiche, perché ogni regola ha la sua finestra temporale.
export default function InsightsCard({ activities, weeklyGoal }: { activities: Activity[]; weeklyGoal: number }) {
  const insights = useMemo(() => buildInsights(activities, { weeklyGoal }), [activities, weeklyGoal])
  if (insights.length === 0) return null

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{insightsText.heading}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{insightsText.subtitle}</p>
      </div>
      {insights.map((ins) => (
        <div key={ins.key} className="flex items-start gap-3">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{ background: 'rgba(var(--accent-rgb),0.1)' }}
            aria-hidden="true"
          >
            {ins.icon}
          </span>
          <p className="text-sm text-gray-300 leading-relaxed flex-1 min-w-0">{ins.text}</p>
        </div>
      ))}
    </div>
  )
}
