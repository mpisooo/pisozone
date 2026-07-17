import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, sendPushToUserIfAllowed } from '../_lib/push.js'
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

  await sendPushToUserIfAllowed(message.receiver_id, 'messages', {
    title: `Nuovo messaggio da ${sender?.username ?? 'un amico'}`,
    body: message.content.slice(0, 100),
    // Deep-link (roadmap v3, pilastro 04): il tap apre la conversazione
    // esatta, non la pagina Social generica. Il query param sopravvive alla
    // navigazione del service worker; Social lo consuma e pulisce l'URL.
    url: `/social?dm=${message.sender_id}`,
  })

  return res.status(200).json({ ok: true })
}

export default withSentry(handler)
