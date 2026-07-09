// Calcola l'offset UTC di Europe/Rome nell'istante dato (+01:00 in inverno/CET,
// +02:00 in estate/CEST) per costruire limiti/ore esatti nel fuso locale.
function getRomeOffset(date: Date): string {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1'
  const match = part.match(/GMT([+-]\d+)/)
  const hours = match ? parseInt(match[1], 10) : 1
  const sign = hours >= 0 ? '+' : '-'
  return `${sign}${String(Math.abs(hours)).padStart(2, '0')}:00`
}

export function getRomeTodayRange(now: Date) {
  const offset = getRomeOffset(now)
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(now)
  return { start: `${ymd}T00:00:00${offset}`, end: `${ymd}T23:59:59.999${offset}` }
}

export function getRomeHour(date: Date): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    hour: 'numeric',
    hour12: false,
  })
    .formatToParts(date)
    .find((p) => p.type === 'hour')?.value ?? '0'
  return parseInt(hour, 10) % 24
}
