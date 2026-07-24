import { createNamespaceProxy, type Widen } from './proxy'

// Nomi e descrizioni dei 6 temi (fix P1-4 dell'audit tecnico del 24/07/2026):
// prima vivevano come stringhe italiane dirette dentro THEME_DEFINITIONS
// (lib/levels.ts), mai passate da createNamespaceProxy — restavano in
// italiano anche con l'app in inglese. THEME_DEFINITIONS resta puramente
// strutturale (id/costo/colori di anteprima); qui solo il testo, chiave per
// ThemeId — consumato da Settings.tsx, l'unico punto che mostra nome e
// descrizione di un tema.
const it = {
  dark: { name: 'Scuro', description: 'Segue il tema del sistema, se non scegli tu' },
  light: { name: 'Chiaro', description: 'Tema chiaro classico' },
  'night-blue': { name: 'Blu Notte', description: 'Sfondo blu profondo + accenti azzurri' },
  white: { name: 'Bianco Puro', description: 'Sfondo bianco minimalista' },
  emerald: { name: 'Smeraldo', description: 'Accenti verde smeraldo' },
  purple: { name: 'Viola', description: 'Accenti viola neon' },
} as const

const en: Widen<typeof it> = {
  dark: { name: 'Dark', description: "Follows your system's theme, unless you choose otherwise" },
  light: { name: 'Light', description: 'Classic light theme' },
  'night-blue': { name: 'Night Blue', description: 'Deep blue background with light blue accents' },
  white: { name: 'Pure White', description: 'Minimalist white background' },
  emerald: { name: 'Emerald', description: 'Emerald green accents' },
  purple: { name: 'Purple', description: 'Neon purple accents' },
}

const themes = createNamespaceProxy(it, en)

export default themes
