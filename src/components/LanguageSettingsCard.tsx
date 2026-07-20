import { Languages } from 'lucide-react'
import { useLanguage, setLanguage, type Language } from '../lib/i18n/language'
import { haptic } from '../lib/haptics'
import profileText from '../lib/i18n/profile'

export default function LanguageSettingsCard() {
  const language = useLanguage()
  const options: { id: Language; label: string }[] = [
    { id: 'it', label: profileText.language.italian },
    { id: 'en', label: profileText.language.english },
  ]

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Languages size={16} className="text-[var(--red)]" />
        <h2 className="font-bebas text-xl text-[var(--red)] tracking-wider">{profileText.language.title}</h2>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{profileText.language.hint}</p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={opt.id === language}
            onClick={() => {
              if (opt.id === language) return
              haptic('light')
              setLanguage(opt.id)
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              opt.id === language ? 'btn-primary' : 'text-gray-400 border border-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
