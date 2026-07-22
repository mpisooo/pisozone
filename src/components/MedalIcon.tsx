import { MEDAL_ICON_PATHS } from '../lib/medalIconPaths'

interface Props {
  medalKey: string
  size?: number
  className?: string
}

// Icona pittogramma per una medaglia (roadmap: "stesso stile delle icone
// sport, ma con la classica cornice della medaglia"), al posto dell'emoji di
// MedalDefinition.icon (rimasta nel dato ma non più usata per il rendering).
// A differenza di ActivityIcon, qui i colori sono FISSI dentro l'SVG (vedi
// lib/medalIconPaths): non eredita currentColor, non si ricolora da chi la
// usa. Decorativa (aria-hidden): va sempre accanto al nome della medaglia,
// già letto dagli screen reader.
export default function MedalIcon({ medalKey, size = 40, className }: Props) {
  const path = MEDAL_ICON_PATHS[medalKey]
  if (!path) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}
