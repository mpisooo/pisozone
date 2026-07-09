import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, CalendarDays, Users, Target } from 'lucide-react'
import { useUnread } from '../context/UnreadContext'
import shell from '../lib/i18n/shell'

type NavItem = {
  to: string
  icon: React.ElementType
  label: string
  matchPaths?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',           icon: Home,         label: shell.navbar.home },
  { to: '/log',        icon: PlusCircle,   label: shell.navbar.log },
  { to: '/calendar',   icon: CalendarDays, label: shell.navbar.analysis, matchPaths: ['/calendar', '/stats'] },
  { to: '/challenges', icon: Target,       label: shell.navbar.challenges },
  { to: '/social',     icon: Users,        label: shell.navbar.social },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { totalUnread } = useUnread()

  return (
    <nav className="navbar fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <ul className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label, matchPaths }) => {
          const isActive = matchPaths
            ? matchPaths.some((p) => pathname.startsWith(p))
            : to === '/' ? pathname === '/' : pathname.startsWith(to)

          const isSocial = to === '/social'

          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center justify-center h-full gap-0.5 text-xs transition-colors duration-200 ${
                  isActive ? 'text-[var(--red)]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={isActive ? { filter: 'drop-shadow(0 0 6px var(--red))' } : {}}
                  />
                  {isSocial && totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-[var(--red)] text-[white] text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </div>
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
