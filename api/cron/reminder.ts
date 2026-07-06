import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, sendToSubscriptions, type PushSubscriptionRow } from '../_lib/push.js'
import { withSentry } from '../_lib/sentry.js'

// Calcola l'offset UTC di Europe/Rome nell'istante dato (+01:00 in inverno/CET,
// +02:00 in estate/CEST) per costruire i limiti esatti della giornata locale.
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

function getRomeTodayRange(now: Date) {
  const offset = getRomeOffset(now)
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(now)
  return { start: `${ymd}T00:00:00${offset}`, end: `${ymd}T23:59:59.999${offset}` }
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { start, end } = getRomeTodayRange(new Date())

  const { data: activitiesToday } = await supabaseAdmin
    .from('activities')
    .select('user_id')
    .gte('date', start)
    .lte('date', end)

  const activeUserIds = new Set((activitiesToday ?? []).map((a) => a.user_id as string))

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_key')

  const toNotify = ((subs ?? []) as (PushSubscriptionRow & { user_id: string })[])
    .filter((s) => !activeUserIds.has(s.user_id))

  await sendToSubscriptions(toNotify, {
    title: 'Non hai ancora registrato nulla oggi 💪',
    body: 'Sono le 22:00: fai ancora in tempo a segnare un allenamento!',
    url: '/log',
  })

  return res.status(200).json({ notified: toNotify.length })
}

export default withSentry(handler)
