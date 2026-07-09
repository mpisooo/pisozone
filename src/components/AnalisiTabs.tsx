import { NavLink } from 'react-router-dom'
import { CalendarDays, BarChart2 } from 'lucide-react'
import stats from '../lib/i18n/stats'

const TABS = [
  { to: '/calendar', icon: CalendarDays, label: stats.tabs.calendar },
  { to: '/stats',    icon: BarChart2,    label: stats.tabs.stats },
]

export default function AnalisiTabs() {
  return (
    <div className="flex gap-1 bg-[var(--grey)] rounded-xl p-1">
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[var(--red)] text-[white] shadow-md'
                : 'text-gray-500 hover:text-gray-300'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
