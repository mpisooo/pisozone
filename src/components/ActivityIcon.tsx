import type { CSSProperties } from 'react'
import type { ActivityType } from '../types'
import { ACTIVITY_ICON_PATHS } from '../lib/activityIconPaths'

interface Props {
  type: ActivityType
  size?: number
  className?: string
  style?: CSSProperties
}

// Icona pittogramma per un tipo di attività (roadmap v2, pilastro 01 punto 3),
// al posto dell'emoji di sistema. stroke/fill="currentColor": eredita il
// colore del testo/contenitore come le icone lucide-react già usate altrove
// nell'app — chi la usa colora via className/style, non c'è una palette
// propria (i secondi toni sono fillOpacity dello stesso colore). Lo spessore
// del tratto è fisso: fa parte del disegno delle icone (griglia 48×48, vedi
// lib/activityIconPaths), non è un parametro di chi le usa. Decorativa
// (aria-hidden): va sempre accanto a un'etichetta testuale già letta dagli
// screen reader.
export default function ActivityIcon({ type, size = 24, className, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={4.5}
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
