import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, sendToSubscriptions, type PushSubscriptionRow } from '../_lib/push.js'
import { withSentry } from '../_lib/sentry.js'
import { getRomeHour, getRomeToday, getRomeTodayRange } from '../_lib/time.js'
import { allowsNotification, type NotificationPrefs } from '../_lib/notificationPrefs.js'
import { classifyReminder } from '../_lib/comeback.js'
import {
  seasonalEventsToAnnounce, computeSeasonalPodium, plusDays,
  type PodiumActivityRow,
} from '../_lib/seasonalPodium.js'

// Podio stagionale → centro notifiche (v45): quando un evento si è appena
// chiuso, i primi 3 ricevono l'invito a riscattare i crediti. Il rank è
// ricalcolato con gli stessi criteri del trigger guard_seasonal_claim (v39):
// la notifica promette solo ciò che il riscatto confermerà. Best effort e
// idempotente: se le notifiche dell'evento esistono già non si reinserisce,
// pre-migrazione l'insert fallisce in silenzio e si ritenta domani.
async function notifySeasonalPodium(romeToday: string): Promise<number> {
  let notified = 0
  for (const ev of seasonalEventsToAnnounce(romeToday)) {
    const { data: already } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('type', 'seasonal_podium')
      .contains('payload', { event_key: ev.key })
      .limit(1)
    if (!already || already.length > 0) continue

    let query = supabaseAdmin
      .from('activities')
      .select('user_id, duration_min, distance_km, calories')
      .gte('date', `${ev.startsOn}T00:00:00Z`)
      .lt('date', `${plusDays(ev.endsOn, 1)}T00:00:00Z`)
    if (ev.activityType) query = query.eq('type', ev.activityType)
    const { data: rows } = await query

    const podium = computeSeasonalPodium((rows ?? []) as PodiumActivityRow[], ev.metric)
    if (podium.length === 0) continue

    const { error } = await supabaseAdmin.from('notifications').insert(
      podium.map((p) => ({
        user_id: p.user_id,
        type: 'seasonal_podium',
        payload: { event_key: ev.key, rank: p.rank },
      })),
    )
    if (!error) notified += podium.length
  }
  return notified
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const now = new Date()
  const { start, end } = getRomeTodayRange(now)

  const { data: activitiesToday } = await supabaseAdmin
    .from('activities')
    .select('user_id')
    .gte('date', start)
    .lte('date', end)

  const activeUserIds = new Set((activitiesToday ?? []).map((a) => a.user_id as string))

  // Chi ha dichiarato un giorno di riposo (recovery_logs, v33) non va
  // disturbato con "vai ad allenarti": il riposo è parte del percorso.
  // Tollerante pre-migrazione: tabella assente = data null, nessuno escluso.
  const { data: restingToday } = await supabaseAdmin
    .from('recovery_logs')
    .select('user_id')
    .eq('day', getRomeToday(now))
    .eq('rest', true)
  for (const r of restingToday ?? []) activeUserIds.add(r.user_id as string)

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_key')

  const candidates = ((subs ?? []) as (PushSubscriptionRow & { user_id: string })[])
    .filter((s) => !activeUserIds.has(s.user_id))

  // Filtra chi ha disattivato il promemoria o è nella propria fascia di silenzio (v28).
  const candidateUserIds = [...new Set(candidates.map((s) => s.user_id))]
  const prefsByUser = new Map<string, NotificationPrefs>()
  if (candidateUserIds.length > 0) {
    const { data: prefsRows } = await supabaseAdmin
      .from('profiles')
      .select('id, notif_reminder_enabled, notif_quiet_start, notif_quiet_end')
      .in('id', candidateUserIds)
    for (const p of prefsRows ?? []) prefsByUser.set(p.id as string, p as NotificationPrefs)
  }

  const romeHour = getRomeHour(now)
  const allowed = candidates.filter((s) => allowsNotification(prefsByUser.get(s.user_id), 'reminder', romeHour))

  // Incentivi al ritorno (v2, pilastro 04): il promemoria smette di
  // martellare chi si è allontanato. Ultima attività negli ultimi 31 giorni
  // per candidato → assenza breve = messaggio standard, pietra miliare
  // (3/7/14/30 giorni) = rientro morbido, tutto il resto = silenzio.
  const allowedUserIds = [...new Set(allowed.map((s) => s.user_id))]
  const lastActivityByUser = new Map<string, string>()
  if (allowedUserIds.length > 0) {
    const since = new Date(now.getTime() - 31 * 24 * 3600 * 1000).toISOString()
    const { data: recent } = await supabaseAdmin
      .from('activities')
      .select('user_id, date')
      .in('user_id', allowedUserIds)
      .gte('date', since)
    for (const a of recent ?? []) {
      const prev = lastActivityByUser.get(a.user_id as string)
      if (!prev || (a.date as string) > prev) lastActivityByUser.set(a.user_id as string, a.date as string)
    }
  }
  const dayMs = 24 * 3600 * 1000
  const daysAbsentOf = (userId: string): number | null => {
    const last = lastActivityByUser.get(userId)
    if (!last) return null
    return Math.max(1, Math.round((now.getTime() - new Date(last).getTime()) / dayMs))
  }

  const standard = allowed.filter((s) => classifyReminder(daysAbsentOf(s.user_id)) === 'standard')
  const comeback = allowed.filter((s) => classifyReminder(daysAbsentOf(s.user_id)) === 'comeback')

  await sendToSubscriptions(standard, {
    title: 'Non hai ancora registrato nulla oggi 💪',
    body: 'Sono le 22:00: fai ancora in tempo a segnare un allenamento!',
    url: '/log',
  })
  await sendToSubscriptions(comeback, {
    title: 'Ci manchi su PisoZone 🌅',
    body: 'Riparti con poco: bastano 15 minuti per rimettere in moto lo streak.',
    url: '/',
  })

  const podiumNotified = await notifySeasonalPodium(getRomeToday(now))

  return res.status(200).json({
    notified: standard.length + comeback.length,
    comeback: comeback.length,
    seasonalPodium: podiumNotified,
  })
}

export default withSentry(handler)
