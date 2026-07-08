import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { withSentry } from '../_lib/sentry.js'
import { rateLimited } from '../_lib/rateLimit.js'

// Client admin dedicato: non riusa _lib/push.js per non inizializzare web-push
// (richiede le VAPID key) in una funzione che non invia notifiche.
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  // Un'eliminazione legittima è un'operazione una tantum: soglia stretta.
  if (rateLimited(req, res, 10)) return

  // L'identità arriva dal JWT di sessione, mai dal body: ognuno può eliminare solo se stesso.
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  if (!token) return res.status(401).json({ error: 'Missing token' })

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
  const user = userData?.user
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  // I file nello Storage (foto profilo e foto delle attività) non cadono in
  // cascata con l'utente: vanno rimossi a parte. list() è paginato (100 per
  // default), quindi si svuota la cartella a lotti; il tetto di iterazioni
  // evita loop infiniti se una remove fallisce silenziosamente.
  for (const bucket of ['avatars', 'activity-photos']) {
    for (let batch = 0; batch < 20; batch++) {
      const { data: files } = await supabaseAdmin.storage.from(bucket).list(user.id)
      if (!files?.length) break
      const { error: removeError } = await supabaseAdmin.storage
        .from(bucket)
        .remove(files.map((f) => `${user.id}/${f.name}`))
      if (removeError) break
    }
  }

  // Tutte le tabelle hanno FK ON DELETE CASCADE da auth.users (dirette o via profiles):
  // eliminare l'utente auth elimina profilo, attività, messaggi, amicizie, ecc.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (deleteError) return res.status(500).json({ error: deleteError.message })

  return res.status(200).json({ ok: true })
}

export default withSentry(handler)
