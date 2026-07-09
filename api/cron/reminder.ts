import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, sendToSubscriptions, type PushSubscriptionRow } from '../_lib/push.js'
import { withSentry } from '../_lib/sentry.js'
import { getRomeHour, getRomeTodayRange } from '../_lib/time.js'
import { allowsNotification, type NotificationPrefs } from '../_lib/notificationPrefs.js'

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
  const toNotify = candidates.filter((s) => allowsNotification(prefsByUser.get(s.user_id), 'reminder', romeHour))

  await sendToSubscriptions(toNotify, {
    title: 'Non hai ancora registrato nulla oggi 💪',
    body: 'Sono le 22:00: fai ancora in tempo a segnare un allenamento!',
    url: '/log',
  })

  return res.status(200).json({ notified: toNotify.length })
}

export default withSentry(handler)
