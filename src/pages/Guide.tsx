import { ChevronDown } from 'lucide-react'
import guide from '../lib/i18n/guide'

// La "wiki" dell'app: tutte le funzionalità spiegate in sezioni richiudibili.
// Contenuto statico dal namespace guide; <details>/<summary> nativi = tastiera
// e screen reader gratis, nessuno stato da gestire.
export default function GuidePage() {
  return (
    <div className="page-enter p-4 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="pt-2">
        <span className="font-bebas text-4xl text-white tracking-widest">{guide.pageTitle}</span>
        <div className="header-accent" />
        <p className="text-xs text-gray-500 mt-2">{guide.intro}</p>
      </div>

      <div className="space-y-3">
        {guide.sections.map((section) => (
          <details key={section.title} className="card group !p-0 overflow-hidden">
            <summary className="flex items-center gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
              <span className="text-2xl flex-shrink-0" aria-hidden="true">{section.icon}</span>
              <span className="font-bebas text-xl text-white tracking-wider flex-1 leading-tight">
                {section.title}
              </span>
              <ChevronDown size={18} className="text-gray-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 space-y-2.5">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-sm text-gray-400 leading-relaxed">{p}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
