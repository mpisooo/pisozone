import { useMemo, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Check } from 'lucide-react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { ACTIVITY_OPTIONS, ACTIVITY_CATEGORY, SPORT_CATEGORY_LABELS, type SportCategory } from '../lib/constants'
import ActivityIcon from './ActivityIcon'
import sportPickerText from '../lib/i18n/sportPicker'
import type { ActivityType } from '../types'

const CATEGORY_ORDER: SportCategory[] = ['piedi', 'ciclismo', 'fitness', 'racchetta', 'palla', 'acqua', 'neve', 'ruote', 'altro']

type Props = {
  onClose: () => void
  favorites: ActivityType[]
} & (
  | { mode: 'single'; selected: ActivityType; onSelect: (type: ActivityType) => void; max?: undefined }
  | { mode: 'multi'; selected: ActivityType[]; onToggle: (type: ActivityType) => void; max: number }
)

// Modale "come Strava" per la scelta sport (22/07/2026): ricerca + preferiti
// pinnati in cima + tutto il catalogo raggruppato per famiglia (vedi
// SPORT_CATEGORY_LABELS in lib/constants.ts). Doppia modalità: single-select
// (Log.tsx/ActivityEditModal.tsx, chiude alla scelta) e multi-select (il
// picker preferiti in Settings.tsx, resta aperto con un bottone "Fatto").
export default function SportPickerModal(props: Props) {
  const { onClose, favorites, mode } = props
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useFocusTrap(panelRef, true, onClose)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(
    () => (normalizedQuery ? ACTIVITY_OPTIONS.filter((o) => o.label.toLowerCase().includes(normalizedQuery)) : null),
    [normalizedQuery],
  )

  const byCategory = useMemo(() => {
    const map = new Map<SportCategory, typeof ACTIVITY_OPTIONS>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])
    for (const opt of ACTIVITY_OPTIONS) map.get(ACTIVITY_CATEGORY[opt.value])!.push(opt)
    return map
  }, [])

  const isSelected = (type: ActivityType) => (mode === 'single' ? props.selected === type : props.selected.includes(type))
  const isDisabled = (type: ActivityType) => mode === 'multi' && !isSelected(type) && props.selected.length >= props.max

  const handlePick = (type: ActivityType) => {
    if (mode === 'single') {
      props.onSelect(type)
      onClose()
    } else {
      if (isDisabled(type)) return
      props.onToggle(type)
    }
  }

  const renderRow = (opt: (typeof ACTIVITY_OPTIONS)[number]) => {
    const selected = isSelected(opt.value)
    const disabled = isDisabled(opt.value)
    return (
      <button
        key={opt.value}
        type="button"
        onClick={() => handlePick(opt.value)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
          disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--grey)]'
        }`}
        style={{ background: selected ? 'rgba(var(--accent-rgb),0.15)' : 'transparent' }}
      >
        <ActivityIcon type={opt.value} size={30} className="flex-shrink-0" />
        <span className="flex-1 text-sm font-medium text-white truncate">{opt.label}</span>
        {selected && <Check size={18} className="text-[var(--red)] flex-shrink-0" />}
      </button>
    )
  }

  const title = mode === 'multi' ? sportPickerText.multiSelect.title : sportPickerText.modal.title

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'multi' ? sportPickerText.multiSelect.dialogAriaLabel : sportPickerText.modal.dialogAriaLabel}
      className="fixed inset-0 z-[100] flex flex-col page-enter"
      style={{ background: 'var(--black)' }}
    >
      <div
        className="flex-shrink-0 px-4 pb-3 border-b border-[var(--grey)] space-y-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
      >
        <div className="flex items-center justify-between">
          <span className="font-bebas text-2xl text-white tracking-wider">{title}</span>
          {mode === 'multi' ? (
            <button type="button" onClick={onClose} className="btn-primary px-4 py-1.5 text-sm">
              {sportPickerText.multiSelect.doneButton}
            </button>
          ) : (
            <button type="button" onClick={onClose} aria-label={sportPickerText.modal.close} className="p-2 -mr-2 text-gray-400 hover:text-white">
              <X size={22} />
            </button>
          )}
        </div>
        {mode === 'multi' && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{sportPickerText.multiSelect.hint(props.max)}</span>
            <span className="flex-shrink-0">{sportPickerText.multiSelect.selectedCount(props.selected.length, props.max)}</span>
          </div>
        )}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={sportPickerText.modal.searchPlaceholder}
            aria-label={sportPickerText.modal.searchAriaLabel}
            className="input-dark w-full pl-9 pr-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        {filtered ? (
          filtered.length > 0 ? (
            <div className="space-y-1">{filtered.map(renderRow)}</div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">{sportPickerText.modal.noResults(query.trim())}</p>
          )
        ) : (
          <>
            {favorites.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-500 tracking-wider px-2.5">{sportPickerText.modal.favoritesTitle.toUpperCase()}</h3>
                {favorites.map((type) => ACTIVITY_OPTIONS.find((o) => o.value === type)).filter((o): o is (typeof ACTIVITY_OPTIONS)[number] => !!o).map(renderRow)}
              </div>
            )}
            {CATEGORY_ORDER.map((cat) => {
              const opts = byCategory.get(cat) ?? []
              if (opts.length === 0) return null
              return (
                <div key={cat} className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 tracking-wider px-2.5">{SPORT_CATEGORY_LABELS[cat].toUpperCase()}</h3>
                  {opts.map(renderRow)}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
