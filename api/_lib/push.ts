import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Riusa VITE_SUPABASE_URL (già configurata su Vercel per il build del client):
// il prefisso VITE_ è solo una convenzione di Vite per l'inclusione nel bundle
// client, non limita la leggibilità della env var lato server.
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth_key: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', userId)

  await sendToSubscriptions((subs as PushSubscriptionRow[]) ?? [], payload)
}

export async function sendToSubscriptions(subs: PushSubscriptionRow[], payload: PushPayload) {
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify(payload),
        )
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Subscription scaduta/revocata: rimuovila per non ritentare inutilmente.
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('sendNotification failed', statusCode, (err as { body?: string }).body ?? err)
        }
      }
    }),
  )
}
