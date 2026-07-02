import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, sendToSubscriptions } from '../_lib/push'

interface FriendshipRecord {
  requester_id: string
  addressee_id: string
  status: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (req.headers['x-webhook-secret'] !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const friendship = (req.body as { record?: FriendshipRecord })?.record
  if (!friendship || friendship.status !== 'pending') {
    return res.status(200).json({ skipped: true })
  }

  const { data: requester } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('id', friendship.requester_id)
    .single()

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', friendship.addressee_id)

  await sendToSubscriptions(subs ?? [], {
    title: 'Nuova richiesta di amicizia',
    body: `${requester?.username ?? 'Un utente'} vuole aggiungerti come amico`,
    url: '/social',
  })

  return res.status(200).json({ ok: true })
}
