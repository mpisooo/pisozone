import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { pushSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } from '../lib/push'

export default function NotificationSettingsCard() {
  const { user } = useAuth()
  const [supported, setSupported] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const ok = pushSupported()
      if (!cancelled) setSupported(ok)
      if (ok) {
        const sub = await isSubscribed()
        if (!cancelled) setSubscribed(sub)
      }
      if (!cancelled) setChecked(true)
    }
    check()
    return () => { cancelled = true }
  }, [])

  const handleToggle = async () => {
    if (!user || working) return
    setWorking(true)
    setError('')
    if (subscribed) {
      const { error: err } = await unsubscribeFromPush()
      setWorking(false)
      if (err) { setError(err); return }
      setSubscribed(false)
    } else {
      const { error: err } = await subscribeToPush(user.id)
      setWorking(false)
      if (err) { setError(err); return }
      setSubscribed(true)
    }
  }

  if (!checked) return null

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Bell size={16} className="text-[#F44352]" />
        <h2 className="font-bebas text-xl text-[#F44352] tracking-wider">NOTIFICHE</h2>
      </div>

      {!supported ? (
        <p className="text-xs text-gray-500 leading-relaxed">
          Le notifiche push non sono supportate su questo browser/dispositivo. Su iPhone funzionano
          solo se aggiungi PisoZone alla schermata Home (Condividi → Aggiungi a Home).
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              {subscribed
                ? <BellRing size={16} className="text-green-400 flex-shrink-0" />
                : <BellOff size={16} className="text-gray-500 flex-shrink-0" />}
              <span className={subscribed ? 'text-green-400' : 'text-gray-400'}>
                {subscribed ? 'Notifiche attive' : 'Notifiche disattivate'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={working}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 ${
                subscribed ? 'text-gray-400 border border-gray-600' : 'btn-primary'
              }`}
            >
              {working ? <Loader2 size={14} className="animate-spin" /> : subscribed ? 'Disattiva' : 'Attiva'}
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Promemoria se non ti alleni entro le 22:00, avvisi per nuovi messaggi e richieste di
            amicizia. Su iPhone funzionano solo se aggiungi PisoZone alla schermata Home.
          </p>
        </>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
