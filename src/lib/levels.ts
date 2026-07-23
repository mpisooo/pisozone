export interface LevelDefinition {
  level: number
  title: string
  costToUnlock: number  // crediti da spendere per salire A questo livello dal precedente
  color: string
  emoji: string
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1,  title: 'Principiante', costToUnlock: 0,    color: '#9ca3af', emoji: '🌱' },
  { level: 2,  title: 'Allenatore',   costToUnlock: 100,  color: '#60a5fa', emoji: '🎯' },
  { level: 3,  title: 'Atleta',       costToUnlock: 150,  color: '#34d399', emoji: '🏃' },
  { level: 4,  title: 'Campione',     costToUnlock: 200,  color: '#f59e0b', emoji: '🏆' },
  { level: 5,  title: 'Guerriero',    costToUnlock: 280,  color: '#f97316', emoji: '⚔️' },
  { level: 6,  title: 'Leggenda',     costToUnlock: 380,  color: '#e879f9', emoji: '⚡' },
  { level: 7,  title: 'Eroe',         costToUnlock: 500,  color: '#c084fc', emoji: '🦅' },
  { level: 8,  title: 'Maestro',      costToUnlock: 650,  color: '#818cf8', emoji: '🔮' },
  { level: 9,  title: 'Elite',        costToUnlock: 830,  color: '#38bdf8', emoji: '💎' },
  { level: 10, title: 'Immortale',    costToUnlock: 1050, color: '#fbbf24', emoji: '👑' },
]

export function getLevelDef(level: number): LevelDefinition {
  const idx = Math.min(Math.max(level, 1), 10) - 1
  return LEVEL_DEFINITIONS[idx]
}

export function getNextLevelDef(currentLevel: number): LevelDefinition | null {
  if (currentLevel >= 10) return null
  return LEVEL_DEFINITIONS[currentLevel]  // index = currentLevel (lv1 → index 0, lv2 → index 1, next is index currentLevel)
}

// ── Temi ──────────────────────────────────────────────────────────────────

export type ThemeId = 'dark' | 'light' | 'night-blue' | 'white' | 'emerald' | 'purple'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
  cost: number
  free: boolean
  previewBg: string
  previewAccent: string
  isLight?: boolean
}

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: 'dark',
    name: 'Scuro',
    description: 'Segue il tema del sistema, se non scegli tu',
    cost: 0,
    free: true,
    previewBg: '#0D0D0D',
    previewAccent: '#F44352',
  },
  {
    id: 'light',
    name: 'Chiaro',
    description: 'Tema chiaro classico',
    cost: 0,
    free: true,
    previewBg: '#F0F2F5',
    previewAccent: '#F44352',
    isLight: true,
  },
  {
    id: 'night-blue',
    name: 'Blu Notte',
    description: 'Sfondo blu profondo + accenti azzurri',
    cost: 400,
    free: false,
    previewBg: '#080c14',
    previewAccent: '#60a5fa',
  },
  {
    id: 'white',
    name: 'Bianco Puro',
    description: 'Sfondo bianco minimalista',
    cost: 300,
    free: false,
    previewBg: '#ffffff',
    previewAccent: '#F44352',
    isLight: true,
  },
  {
    id: 'emerald',
    name: 'Smeraldo',
    description: 'Accenti verde smeraldo',
    cost: 500,
    free: false,
    previewBg: '#0a110e',
    previewAccent: '#10b981',
  },
  {
    id: 'purple',
    name: 'Viola',
    description: 'Accenti viola neon',
    cost: 600,
    free: false,
    previewBg: '#0d0917',
    previewAccent: '#a855f7',
  },
]

export const THEME_CSS_VARS: Record<ThemeId, Record<string, string>> = {
  dark: {
    '--black': '#0D0D0D',
    '--grey-dark': '#1a1a1a',
    '--grey': '#2a2a2a',
    '--grey-light': '#3a3a3a',
    '--red': '#F44352',
    '--red-dark': '#CC3845',
    '--accent-rgb': '244, 67, 82',
    '--color-text': '#f5f5f5',
  },
  light: {
    '--black': '#F0F2F5',
    '--grey-dark': '#FFFFFF',
    '--grey': '#EBEBED',
    '--grey-light': '#DDDEE0',
    '--red': '#F44352',
    '--red-dark': '#CC3845',
    '--accent-rgb': '244, 67, 82',
    '--color-text': '#111111',
  },
  'night-blue': {
    '--black': '#080c14',
    '--grey-dark': '#0d1628',
    '--grey': '#162032',
    '--grey-light': '#1e2d40',
    '--red': '#60a5fa',
    '--red-dark': '#3b82f6',
    '--accent-rgb': '96, 165, 250',
    '--color-text': '#e2e8f0',
  },
  white: {
    '--black': '#ffffff',
    '--grey-dark': '#f8f9fa',
    '--grey': '#f0f2f5',
    '--grey-light': '#e5e7eb',
    '--red': '#F44352',
    '--red-dark': '#CC3845',
    '--accent-rgb': '244, 67, 82',
    '--color-text': '#111111',
  },
  emerald: {
    '--black': '#0a110e',
    '--grey-dark': '#0f1912',
    '--grey': '#162318',
    '--grey-light': '#1e3023',
    '--red': '#10b981',
    '--red-dark': '#059669',
    '--accent-rgb': '16, 185, 129',
    '--color-text': '#ecfdf5',
  },
  purple: {
    '--black': '#0d0917',
    '--grey-dark': '#130d24',
    '--grey': '#1a1230',
    '--grey-light': '#231940',
    '--red': '#a855f7',
    '--red-dark': '#9333ea',
    '--accent-rgb': '168, 85, 247',
    '--color-text': '#faf5ff',
  },
}

export const VALID_THEME_IDS: ThemeId[] = ['dark', 'light', 'night-blue', 'white', 'emerald', 'purple']
