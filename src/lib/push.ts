import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && Boolean(VAPID_PUBLIC_KEY)
}

export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub !== null
}

export async function subscribeToPush(userId: string): Promise<{ error: string | null }> {
  if (!pushSupported()) {
    return { error: 'Le notifiche push non sono supportate su questo dispositivo/browser.' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { error: 'Permesso negato. Abilita le notifiche dalle impostazioni del browser.' }
  }

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
    })
  }

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth_key: json.keys?.auth ?? '',
    },
    { onConflict: 'endpoint', ignoreDuplicates: true },
  )
  if (error) return { error: 'Salvataggio non riuscito. Riprova.' }
  return { error: null }
}

export async function unsubscribeFromPush(): Promise<{ error: string | null }> {
  if (!pushSupported()) return { error: null }
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return { error: null }

  const endpoint = sub.endpoint
  await sub.unsubscribe()
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) {
    return { error: 'Disattivate su questo dispositivo, ma la rimozione lato server non è riuscita.' }
  }
  return { error: null }
}
