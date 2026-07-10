import type { CSSProperties } from 'react'
import type { ActivityType } from '../types'
import { ACTIVITY_ICON_PATHS } from '../lib/activityIconPaths'

interface Props {
  type: ActivityType
  size?: number
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

// Icona di linea per un tipo di attività (roadmap v2, pilastro 01 punto 3),
// al posto dell'emoji di sistema. stroke="currentColor" di default: eredita
// il colore del testo/contenitore come le icone lucide-react già usate
// altrove nell'app — chi la usa colora via className/style, non c'è una
// palette propria. Decorativa (aria-hidden): va sempre accanto a un'etichetta
// testuale già letta dagli screen reader.
export default function ActivityIcon({ type, size = 24, strokeWidth = 1.75, className, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {ACTIVITY_ICON_PATHS[type]}
    </svg>
  )
}
