import type { ActivityType, MedalDefinition, AchievementStats } from '../types'

export const ACTIVITY_OPTIONS: { value: ActivityType; label: string; hasDist: boolean }[] = [
  { value: 'corsa',     label: 'Corsa',     hasDist: true  },
  { value: 'bici',      label: 'Bici',      hasDist: true  },
  { value: 'calcio',    label: 'Calcio',    hasDist: false },
  { value: 'pallavolo', label: 'Pallavolo', hasDist: false },
  { value: 'basket',    label: 'Basket',    hasDist: false },
  { value: 'palestra',  label: 'Palestra',  hasDist: false },
  { value: 'nuoto',     label: 'Nuoto',     hasDist: true  },
  { value: 'camminata', label: 'Camminata', hasDist: true  },
  { value: 'tennis',    label: 'Tennis',    hasDist: false },
  { value: 'yoga',        label: 'Yoga',        hasDist: false },
  { value: 'danza',       label: 'Danza',       hasDist: false },
  { value: 'motocross',   label: 'Motocross',   hasDist: true  },
  { value: 'golf',        label: 'Golf',        hasDist: false },
  { value: 'arrampicata', label: 'Arrampicata', hasDist: false },
  { value: 'padel',       label: 'Padel',       hasDist: false },
  { value: 'beach_volley', label: 'Beach volley', hasDist: false },
  { value: 'ping_pong',    label: 'Ping pong',    hasDist: false },
  { value: 'salto_corda',  label: 'Salto corda',  hasDist: false },
  { value: 'trekking',     label: 'Trekking',     hasDist: true  },
  { value: 'boxe',         label: 'Boxe',         hasDist: false },
]

// MET values (metabolic equivalent) per activity
export const MET: Record<ActivityType, number> = {
  corsa:       9.8,
  bici:        7.5,
  calcio:      7.0,
  pallavolo:   4.0,
  basket:      6.5,
  palestra:    5.0,
  nuoto:       8.0,
  camminata:   3.5,
  tennis:      7.3,
  yoga:        2.5,
  danza:       4.8,
  motocross:   5.0,
  golf:        4.3,
  arrampicata: 7.5,
  padel:       6.0,
  beach_volley: 8.0,
  ping_pong:    4.0,
  salto_corda: 11.0,
  trekking:     6.0,
  boxe:         7.8,
}

// Varianti indoor/outdoor (v38): solo per gli sport dove il "dove" cambia il
// nome dell'attività (tapis roulant ≠ corsa al parco). Le etichette sono DATI
// di dominio come i label degli sport, quindi vivono qui e non in i18n.
// `chip` = testo dei due bottoni nel form; `label` = nome mostrato al posto
// di quello base nel feed/calendario/Home quando activities.indoor è valorizzato
// (null/undefined = non indicato → resta il label base).
export const INDOOR_VARIANTS: Partial<Record<ActivityType, {
  outdoorChip: string
  indoorChip: string
  indoorLabel: string
  outdoorLabel?: string
}>> = {
  corsa:       { outdoorChip: "All'aperto",  indoorChip: 'Tapis roulant', indoorLabel: 'Tapis roulant' },
  bici:        { outdoorChip: "All'aperto",  indoorChip: 'Cyclette',      indoorLabel: 'Cyclette' },
  camminata:   { outdoorChip: "All'aperto",  indoorChip: 'Tapis roulant', indoorLabel: 'Camminata su tapis' },
  nuoto:       { outdoorChip: 'Acque libere', indoorChip: 'Piscina',      indoorLabel: 'Nuoto in piscina', outdoorLabel: 'Nuoto in acque libere' },
  arrampicata: { outdoorChip: 'Falesia',      indoorChip: 'Indoor',       indoorLabel: 'Arrampicata indoor', outdoorLabel: 'Arrampicata su roccia' },
}

// Etichetta da mostrare per un'attività: quella base, o la variante
// indoor/outdoor se lo sport la prevede e l'utente l'ha indicata.
export function activityLabel(type: ActivityType, indoor?: boolean | null): string {
  const base = ACTIVITY_OPTIONS.find((o) => o.value === type)?.label ?? type
  if (indoor == null) return base
  const variant = INDOOR_VARIANTS[type]
  if (!variant) return base
  return indoor ? variant.indoorLabel : (variant.outdoorLabel ?? base)
}

export function calcCalories(
  type: ActivityType,
  durationMin: number,
  weightKg: number,
  gender?: 'male' | 'female' | null,
): number {
  // Le donne bruciano mediamente ~10% meno kcal a parità di peso/attività
  // per via di una maggiore percentuale di massa grassa rispetto alla massa magra
  const genderFactor = gender === 'female' ? 0.9 : 1.0
  return Math.round(MET[type] * weightKg * (durationMin / 60) * genderFactor)
}

export type GpsTrackableType = 'corsa' | 'bici' | 'camminata' | 'trekking'

// Attività idonee al tracciamento GPS: outdoor, telefono trasportabile,
// distanza rilevante. Escluse nuoto (impossibile portare il telefono) e
// motocross (non ha senso portarlo mentre si guida) anche se in
// ACTIVITY_OPTIONS hanno hasDist: true per l'inserimento manuale.
export const GPS_TRACKABLE_TYPES: GpsTrackableType[] = ['corsa', 'bici', 'camminata', 'trekking']

export type ElevationCapableType = 'corsa' | 'bici' | 'camminata' | 'trekking' | 'arrampicata' | 'motocross'

// Sport dove il dislivello positivo (D+) ha senso come dato manuale: gli
// stessi del GPS (per chi non traccia comunque lo vuole segnare a mano) più
// arrampicata (mai tracciabile via GPS, ma il dislivello È la sessione) e
// motocross (fuoristrada). Il campo compare nel form solo per questi tipi,
// e solo quando l'attività non è già tracciata via GPS (lì il dato arriva
// da computeElevationProfile, non va sovrascritto a mano).
export const ELEVATION_CAPABLE_TYPES: ElevationCapableType[] = [
  'corsa', 'bici', 'camminata', 'trekking', 'arrampicata', 'motocross',
]

// MET per fascia di velocità media (km/h), valori approssimati dal Compendium
// of Physical Activities: a parità di durata, correre a 8 km/h e a 16 km/h
// bruciano calorie molto diverse, cosa che il MET fisso di calcCalories non
// distingue. Ogni voce copre "fino a maxKmh compreso"; l'ultima (Infinity)
// copre tutto ciò che sta sopra la soglia precedente.
const SPEED_MET_TABLE: Record<GpsTrackableType, { maxKmh: number; met: number }[]> = {
  camminata: [
    { maxKmh: 3.2, met: 2.0 },
    { maxKmh: 4.7, met: 2.8 },
    { maxKmh: 5.5, met: 3.3 },
    { maxKmh: 6.4, met: 4.3 },
    { maxKmh: 7.2, met: 5.0 },
    { maxKmh: Infinity, met: 6.3 },
  ],
  corsa: [
    { maxKmh: 8.0, met: 6.0 },
    { maxKmh: 9.6, met: 8.3 },
    { maxKmh: 10.8, met: 9.0 },
    { maxKmh: 11.3, met: 9.8 },
    { maxKmh: 12.9, met: 10.5 },
    { maxKmh: 14.5, met: 11.0 },
    { maxKmh: 16.1, met: 11.8 },
    { maxKmh: 17.7, met: 12.8 },
    { maxKmh: 19.3, met: 14.5 },
    { maxKmh: Infinity, met: 16.0 },
  ],
  bici: [
    { maxKmh: 16.0, met: 4.0 },
    { maxKmh: 19.3, met: 6.8 },
    { maxKmh: 22.5, met: 8.0 },
    { maxKmh: 25.7, met: 10.0 },
    { maxKmh: 30.6, met: 12.0 },
    { maxKmh: Infinity, met: 15.8 },
  ],
  // Camminata in montagna: alle stesse velocità della camminata piana il
  // dispendio è più alto (pendenza, terreno, zaino) — valori "hiking" del
  // Compendium, con la fascia alta che copre i tratti veloci in salita.
  trekking: [
    { maxKmh: 3.2, met: 4.3 },
    { maxKmh: 4.7, met: 5.3 },
    { maxKmh: 5.5, met: 6.0 },
    { maxKmh: 6.4, met: 7.0 },
    { maxKmh: Infinity, met: 7.8 },
  ],
}

// Esportata anche per la zona "live" del tracciamento (zoneForSpeed in
// lib/zones.ts): stessa tabella, così zona e calorie raccontano lo stesso sforzo.
export function metForSpeed(type: GpsTrackableType, avgSpeedKmh: number): number {
  const table = SPEED_MET_TABLE[type]
  return (table.find((bracket) => avgSpeedKmh <= bracket.maxKmh) ?? table[table.length - 1]).met
}

// Come calcCalories, ma con il MET derivato dalla velocità media invece che
// fisso — usata per le attività registrate con il tracciamento GPS. Se la
// velocità non è valida (sessione troppo corta, GPS mai agganciato), ricade
// sul MET fisso così c'è sempre un valore.
export function calcCaloriesFromSpeed(
  type: GpsTrackableType,
  durationMin: number,
  avgSpeedKmh: number,
  weightKg: number,
  gender?: 'male' | 'female' | null,
): number {
  if (!Number.isFinite(avgSpeedKmh) || avgSpeedKmh <= 0) {
    return calcCalories(type, durationMin, weightKg, gender)
  }
  const genderFactor = gender === 'female' ? 0.9 : 1.0
  return Math.round(metForSpeed(type, avgSpeedKmh) * weightKg * (durationMin / 60) * genderFactor)
}

export const MEDALS: MedalDefinition[] = [
  // BRONZE
  {
    key: 'prima_mossa',
    name: 'Prima Mossa',
    description: 'Prima attività registrata',
    tier: 'bronze',
    icon: '👟',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalActivities, 1), target: 1 }),
  },
  {
    key: 'settimana_attiva',
    name: 'Settimana Attiva',
    description: '3 attività in una settimana',
    tier: 'bronze',
    icon: '📅',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalActivities, 3), target: 3 }),
  },
  {
    key: 'runner_esordiente',
    name: 'Runner Esordiente',
    description: 'Prima corsa registrata',
    tier: 'bronze',
    icon: '🏃',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.activityTypeCounts.corsa, 1), target: 1 }),
  },
  // SILVER
  {
    key: 'maratoneta',
    name: 'Maratoneta',
    description: '50 km totali di corsa',
    tier: 'silver',
    icon: '🏅',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalRunKm, 50), target: 50 }),
  },
  {
    key: 'ferro_da_stiro',
    name: 'Ferro da Stiro',
    description: '10 sessioni in palestra',
    tier: 'silver',
    icon: '🏋️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.gymSessions, 10), target: 10 }),
  },
  {
    key: 'costante',
    name: 'Costante',
    description: '7 giorni consecutivi di attività',
    tier: 'silver',
    icon: '🔥',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxStreak, 7), target: 7 }),
  },
  // GOLD
  {
    key: 'centurione',
    name: 'Centurione',
    description: '100 attività totali registrate',
    tier: 'gold',
    icon: '⚔️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalActivities, 100), target: 100 }),
  },
  {
    key: 'ultra_runner',
    name: 'Ultra Runner',
    description: '500 km totali di corsa',
    tier: 'gold',
    icon: '🦅',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalRunKm, 500), target: 500 }),
  },
  {
    key: 'leggenda',
    name: 'Leggenda',
    description: '365 giorni di attività in un anno',
    tier: 'gold',
    icon: '👑',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.activeDaysInYear, 365), target: 365 }),
  },
  // BRONZE extra
  {
    key: 'mattiniero',
    name: 'Mattiniero',
    description: '5 allenamenti completati prima delle 8:00',
    tier: 'bronze',
    icon: '🌅',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.earlyMorningCount, 5), target: 5 }),
  },
  {
    key: 'doppio_impegno',
    name: 'Doppio Impegno',
    description: '2 attività nello stesso giorno per 5 volte',
    tier: 'bronze',
    icon: '⚡',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.daysWithMultipleActivities, 5), target: 5 }),
  },
  // SILVER extra
  {
    key: 'tuttofare',
    name: 'Tuttofare',
    description: '3 tipi diversi di attività in un solo giorno',
    tier: 'silver',
    icon: '🎯',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxDistinctTypesInDay, 3), target: 3 }),
  },
  {
    key: 'multisport',
    name: 'Multisport',
    description: 'Prova almeno 5 tipi diversi di attività',
    tier: 'silver',
    icon: '🌀',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.distinctTypesUsed, 5), target: 5 }),
  },
  {
    key: 'guerriero_weekend',
    name: 'Guerriero del Weekend',
    description: '10 allenamenti nel weekend',
    tier: 'silver',
    icon: '🛡️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.weekendWorkoutCount, 10), target: 10 }),
  },
  // GOLD extra
  {
    key: 'grande_allenatore',
    name: 'Grande Allenatore',
    description: '3 ore totali di attività in un solo giorno',
    tier: 'gold',
    icon: '💪',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxDurationMinInDay, 180), target: 180 }),
  },
  {
    key: 'stagionale',
    name: 'Stagionale',
    description: '20 attività in un solo mese',
    tier: 'gold',
    icon: '📆',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxActivitiesInMonth, 20), target: 20 }),
  },
  // MONTAGNA (roadmap v3, pilastro 03): km tracciati col GPS (Esploratore,
  // Cartografo) e D+ cumulato (Scalatore, Ottomila) da elevation_gain_m
  // (v44) — che ora può arrivare anche da inserimento manuale per gli sport
  // in ELEVATION_CAPABLE_TYPES (nessuna nuova colonna: stesso campo, fonte
  // diversa), non solo dal GPS. Conta solo dalle attività registrate da lì
  // in poi: non è un bug, è il costo dichiarato di tenere achievementStats
  // su una colonna.
  {
    key: 'esploratore',
    name: 'Esploratore',
    description: '100 km percorsi col tracciamento GPS',
    tier: 'silver',
    icon: '🧭',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalGpsKm, 100), target: 100 }),
  },
  {
    key: 'cartografo',
    name: 'Cartografo',
    description: '500 km percorsi col tracciamento GPS',
    tier: 'gold',
    icon: '🗺️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalGpsKm, 500), target: 500 }),
  },
  {
    key: 'scalatore',
    name: 'Scalatore',
    description: '1.000 m di dislivello in salita accumulati',
    tier: 'silver',
    icon: '⛰️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalElevationGainM, 1000), target: 1000 }),
  },
  {
    key: 'ottomila',
    name: 'Ottomila',
    description: '8.848 m di dislivello accumulati: l\'altezza dell\'Everest',
    tier: 'gold',
    icon: '🏔️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalElevationGainM, 8848), target: 8848 }),
  },
  // DIAMOND
  {
    key: 'inarrestabile',
    name: 'Inarrestabile',
    description: '30 giorni consecutivi di attività',
    tier: 'diamond',
    icon: '💎',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.maxStreak, 30), target: 30 }),
  },
  {
    key: 'campione_annuale',
    name: 'Campione Annuale',
    description: 'Obiettivo settimanale rispettato per 52 settimane',
    tier: 'diamond',
    icon: '🏆',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.weeklyGoalMetWeeks, 52), target: 52 }),
  },
  {
    key: 'instancabile',
    name: 'Instancabile',
    description: '250 attività totali registrate',
    tier: 'diamond',
    icon: '🎖️',
    checkProgress: (s: AchievementStats) => ({ current: Math.min(s.totalActivities, 250), target: 250 }),
  },
]

export const TIER_LABELS: Record<string, string> = {
  bronze: '🥉 Bronzo',
  silver: '🥈 Argento',
  gold: '🥇 Oro',
  diamond: '💎 Diamante',
}

export const TIER_COLORS: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-slate-400 to-slate-200',
  gold: 'from-yellow-500 to-yellow-300',
  diamond: 'from-cyan-400 to-purple-500',
}

// Crediti assegnati una tantum allo sblocco di una medaglia, per tier.
// Scala coerente con i crediti delle sfide giornaliere (15-50), senza esagerare.
export const TIER_CREDITS: Record<string, number> = {
  bronze: 20,
  silver: 35,
  gold: 60,
  diamond: 100,
}
