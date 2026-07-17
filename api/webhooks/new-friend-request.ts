import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin, sendPushToUserIfAllowed } from '../_lib/push.js'
import { withSentry } from '../_lib/sentry.js'
import { rateLimited } from '../_lib/rateLimit.js'

interface FriendshipRecord {
  requester_id: string
  addressee_id: string
  status: string
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  // Soglia alta: il traffico legittimo arriva dagli IP di Supabase (condivisi
  // tra tutti gli utenti); i trigger v23 limitano già le richieste per utente.
  if (rateLimited(req, res, 300)) return
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

  await sendPushToUserIfAllowed(friendship.addressee_id, 'friend_requests', {
    title: 'Nuova richiesta di amicizia',
    body: `${requester?.username ?? 'Un utente'} vuole aggiungerti come amico`,
    // Deep-link (roadmap v3, pilastro 04): dritti alla scheda Amici, dove
    // la richiesta è in cima in attesa di risposta.
    url: '/social?tab=friends',
  })

  return res.status(200).json({ ok: true })
}

export default withSentry(handler)
