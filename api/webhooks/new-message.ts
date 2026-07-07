import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, sendToSubscriptions } from '../_lib/push.js'
import { withSentry } from '../_lib/sentry.js'
import { rateLimited } from '../_lib/rateLimit.js'

interface MessageRecord {
  sender_id: string
  receiver_id: string
  content: string
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  // Soglia alta: il traffico legittimo arriva dagli IP di Supabase (condivisi
  // tra tutti gli utenti) e per superarla servirebbero 5 messaggi/secondo.
  if (rateLimited(req, res, 300)) return
  if (req.headers['x-webhook-secret'] !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const message = (req.body as { record?: MessageRecord })?.record
  if (!message) return res.status(400).json({ error: 'Missing record' })

  const { data: sender } = await supabaseAdmin
    .from('profiles')
    .select('username')
    .eq('id', message.sender_id)
    .single()

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', message.receiver_id)

  await sendToSubscriptions(subs ?? [], {
    title: `Nuovo messaggio da ${sender?.username ?? 'un amico'}`,
    body: message.content.slice(0, 100),
    url: '/social',
  })

  return res.status(200).json({ ok: true })
}

export default withSentry(handler)
