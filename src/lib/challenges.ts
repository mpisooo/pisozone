import type { Activity, ChallengeTemplate } from '../types'
import { format, startOfDay, parseISO, differenceInCalendarDays } from 'date-fns'

export const CHALLENGE_POOL: ChallengeTemplate[] = [
  // — Facili (15 crediti) —
  {
    key: 'log_any',
    title: 'Muoviti!',
    description: "Registra almeno un'attività oggi",
    icon: '🏃',
    credits: 15,
    check: (acts) => acts.length >= 1,
  },
  {
    key: 'log_30min',
    title: "Mezz'ora di sport",
    description: 'Allenati per almeno 30 minuti',
    icon: '⏱️',
    credits: 15,
    check: (acts) => acts.reduce((s, a) => s + a.duration_min, 0) >= 30,
  },
  {
    key: 'burn_200',
    title: 'Brucia calorie',
    description: 'Brucia almeno 200 calorie oggi',
    icon: '🔥',
    credits: 15,
    check: (acts) => acts.reduce((s, a) => s + (a.calories ?? 0), 0) >= 200,
  },
  {
    key: 'outdoor',
    title: 'Aria aperta',
    description: 'Fai una corsa o una camminata di almeno 15 minuti',
    icon: '🌿',
    credits: 15,
    check: (acts) => acts.some((a) => (a.type === 'corsa' || a.type === 'camminata') && a.duration_min >= 15),
  },
  {
    key: 'log_yoga',
    title: 'Equilibrio mentale',
    description: 'Fai una sessione di yoga di almeno 10 minuti',
    icon: '🧘',
    credits: 15,
    check: (acts) => acts.some((a) => a.type === 'yoga' && a.duration_min >= 10),
  },

  // — Medi (20–25 crediti) —
  {
    key: 'log_corsa',
    title: 'Runner',
    description: 'Fai una corsa di almeno 15 minuti',
    icon: '🏃',
    credits: 20,
    check: (acts) => acts.some((a) => a.type === 'corsa' && a.duration_min >= 15),
  },
  {
    key: 'log_palestra',
    title: 'Giorno in palestra',
    description: 'Allena in palestra per almeno 20 minuti',
    icon: '🏋️',
    credits: 20,
    check: (acts) => acts.some((a) => a.type === 'palestra' && a.duration_min >= 20),
  },
  {
    key: 'log_nuoto',
    title: 'Acqua e forza',
    description: 'Nuota per almeno 15 minuti',
    icon: '🏊',
    credits: 20,
    check: (acts) => acts.some((a) => a.type === 'nuoto' && a.duration_min >= 15),
  },
  {
    key: 'log_bici',
    title: 'In sella!',
    description: 'Pedala per almeno 20 minuti',
    icon: '🚴',
    credits: 20,
    check: (acts) => acts.some((a) => a.type === 'bici' && a.duration_min >= 20),
  },
  {
    key: 'team_sport',
    title: 'Sport di squadra',
    description: 'Gioca a calcio, basket o pallavolo per almeno 30 minuti',
    icon: '🤝',
    credits: 20,
    check: (acts) => acts.some((a) => ['calcio', 'basket', 'pallavolo'].includes(a.type) && a.duration_min >= 30),
  },
  {
    key: 'log_60min',
    title: "Un'ora di sport",
    description: 'Allenati per almeno 60 minuti oggi',
    icon: '⏱️',
    credits: 25,
    check: (acts) => acts.reduce((s, a) => s + a.duration_min, 0) >= 60,
  },
  {
    key: 'burn_400',
    title: 'Forno acceso',
    description: 'Brucia almeno 400 calorie oggi',
    icon: '🔥',
    credits: 25,
    check: (acts) => acts.reduce((s, a) => s + (a.calories ?? 0), 0) >= 400,
  },
  {
    key: 'early_bird',
    title: 'Mattiniero',
    description: "Registra un'attività di almeno 10 minuti entro le 12:00",
    icon: '🌅',
    credits: 25,
    check: (acts) => acts.some((a) => new Date(a.date).getHours() < 12 && a.duration_min >= 10),
  },
  {
    key: 'streak_3',
    title: 'Tre di fila',
    description: 'Raggiungi uno streak di 3 giorni',
    icon: '🔥',
    credits: 20,
    check: (_acts, streak) => streak >= 3,
  },

  // — Difficili (30–50 crediti) —
  {
    key: 'log_2',
    title: 'Doppio colpo',
    description: 'Registra 2 attività oggi',
    icon: '⚡',
    credits: 30,
    check: (acts) => acts.length >= 2,
  },
  {
    key: 'log_90min',
    title: 'Maratona di sport',
    description: 'Allenati per almeno 90 minuti oggi',
    icon: '💪',
    credits: 35,
    check: (acts) => acts.reduce((s, a) => s + a.duration_min, 0) >= 90,
  },
  {
    key: 'streak_5',
    title: 'Cinque di fila',
    description: 'Raggiungi uno streak di 5 giorni',
    icon: '🔥',
    credits: 30,
    check: (_acts, streak) => streak >= 5,
  },
  {
    key: 'streak_7',
    title: 'Settimana perfetta',
    description: 'Raggiungi 7 giorni consecutivi',
    icon: '👑',
    credits: 50,
    check: (_acts, streak) => streak >= 7,
  },
]

function hashToSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let s = seed
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let z = Math.imul(s ^ (s >>> 15), 1 | s)
    z ^= z + Math.imul(z ^ (z >>> 7), 61 | z)
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
}

export function generateDailyChallenges(userId: string, date: string): ChallengeTemplate[] {
  const rand = mulberry32(hashToSeed(userId + date))
  const pool = [...CHALLENGE_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 3)
}

export function calcStreak(activities: Activity[], frozenDates: string[] = []): number {
  // Combine activity days (yyyy-MM-dd) with frozen dates
  const activityDays = activities.map((a) => format(startOfDay(parseISO(a.date)), 'yyyy-MM-dd'))
  const allActiveDays = new Set([...activityDays, ...frozenDates])

  const sorted = [...allActiveDays].sort().reverse()
  if (!sorted.length) return 0

  let streak = 0
  let cursor = format(startOfDay(new Date()), 'yyyy-MM-dd')
  for (const d of sorted) {
    const diff = differenceInCalendarDays(parseISO(cursor), parseISO(d))
    if (diff <= 1) { streak++; cursor = d }
    else break
  }
  return streak
}
