import { createNamespaceProxy, type Widen } from './proxy'

// Namespace per il picker sport "come Strava" (22/07/2026): riga rapida con
// i preferiti + modale a schermo intero con ricerca e categorie, condiviso
// da Log.tsx, ActivityEditModal.tsx e (in modalità multi-selezione) dal
// picker preferiti in Settings.tsx.
const it = {
  quickRow: {
    moreButton: 'Cerca altro sport',
    emptyHint: 'Segna i tuoi sport preferiti nelle Impostazioni per trovarli qui in un tocco.',
  },
  modal: {
    title: 'Scegli sport',
    favoritesTitle: 'Sport preferiti',
    searchPlaceholder: 'Cerca uno sport...',
    searchAriaLabel: 'Cerca uno sport',
    close: 'Chiudi',
    dialogAriaLabel: 'Scegli uno sport',
    noResults: (query: string) => `Nessuno sport trovato per "${query}"`,
  },
  multiSelect: {
    title: 'Sport preferiti',
    dialogAriaLabel: 'Scegli i tuoi sport preferiti',
    hint: (max: number) => `Scegli fino a ${max} attività che pratichi di più`,
    selectedCount: (n: number, max: number) => `${n}/${max} selezionati`,
    doneButton: 'Fatto',
  },
} as const

const en: Widen<typeof it> = {
  quickRow: {
    moreButton: 'Search more sports',
    emptyHint: 'Mark your favorite sports in Settings to find them here in one tap.',
  },
  modal: {
    title: 'Choose a sport',
    favoritesTitle: 'Favorite sports',
    searchPlaceholder: 'Search a sport...',
    searchAriaLabel: 'Search a sport',
    close: 'Close',
    dialogAriaLabel: 'Choose a sport',
    noResults: (query: string) => `No sport found for "${query}"`,
  },
  multiSelect: {
    title: 'Favorite sports',
    dialogAriaLabel: 'Choose your favorite sports',
    hint: (max: number) => `Choose up to ${max} activities you practice most`,
    selectedCount: (n: number, max: number) => `${n}/${max} selected`,
    doneButton: 'Done',
  },
}

const sportPickerText = createNamespaceProxy(it, en)

export default sportPickerText
