import { Search } from 'lucide-react'
import { ACTIVITY_OPTIONS } from '../lib/constants'
import ActivityIcon from './ActivityIcon'
import sportPickerText from '../lib/i18n/sportPicker'
import type { ActivityType } from '../types'

interface Props {
  favorites: ActivityType[]
  selected: ActivityType
  onSelect: (type: ActivityType) => void
  onOpenPicker: () => void
}

// Riga rapida "come Strava" (22/07/2026): i soli sport preferiti dell'utente
// (Settings → Sport preferiti) più, se lo sport attivo non è tra questi, lo
// sport selezionato in coda — così la selezione corrente è sempre visibile
// anche scegliendo qualcosa fuori dai preferiti. Il pulsante finale apre
// SportPickerModal con ricerca + intero catalogo.
export default function SportQuickRow({ favorites, selected, onSelect, onOpenPicker }: Props) {
  const displayTypes = favorites.includes(selected) ? favorites : [selected, ...favorites]

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {displayTypes.map((type) => {
          const opt = ACTIVITY_OPTIONS.find((o) => o.value === type)
          if (!opt) return null
          const isSelected = selected === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200 ${
                isSelected ? 'border-[var(--red)]' : 'border-transparent'
              }`}
              style={{ background: isSelected ? 'rgba(var(--accent-rgb),0.15)' : 'var(--grey)', minWidth: '64px' }}
            >
              <ActivityIcon type={opt.value} className={`transition-all duration-200 ${isSelected ? 'grayscale-0' : 'grayscale opacity-50'}`} />
              <span className="text-[10px] text-gray-300 text-center leading-tight">{opt.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onOpenPicker}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
          style={{ minWidth: '64px', background: 'var(--grey)' }}
        >
          <Search size={20} />
          <span className="text-[10px] text-center leading-tight">{sportPickerText.quickRow.moreButton}</span>
        </button>
      </div>
      {favorites.length === 0 && (
        <p className="text-xs text-gray-500 px-0.5">{sportPickerText.quickRow.emptyHint}</p>
      )}
    </div>
  )
}
