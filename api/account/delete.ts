import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { withSentry } from '../_lib/sentry.js'

// Client admin dedicato: non riusa _lib/push.js per non inizializzare web-push
// (richiede le VAPID key) in una funzione che non invia notifiche.
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // L'identità arriva dal JWT di sessione, mai dal body: ognuno può eliminare solo se stesso.
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  if (!token) return res.status(401).json({ error: 'Missing token' })

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
  const user = userData?.user
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // La foto profilo nello Storage non cade in cascata con l'utente: va rimossa a parte.
  const { data: files } = await supabaseAdmin.storage.from('avatars').list(user.id)
  if (files?.length) {
    await supabaseAdmin.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`))
  }

  // Tutte le tabelle hanno FK ON DELETE CASCADE da auth.users (dirette o via profiles):
  // eliminare l'utente auth elimina profilo, attività, messaggi, amicizie, ecc.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (deleteError) return res.status(500).json({ error: deleteError.message })

  return res.status(200).json({ ok: true })
}

export default withSentry(handler)
