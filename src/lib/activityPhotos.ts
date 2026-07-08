import { supabase } from './supabase'

// Foto delle attività (roadmap punto 13): bucket pubblico "activity-photos",
// un solo file per attività al path stabile {userId}/{activityId}.jpg — così
// la sostituzione è un upsert e la cancellazione non deve interrogare lo Storage.
const BUCKET = 'activity-photos'
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82
// Deve combaciare con file_size_limit del bucket (migrazione v27)
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function photoPath(userId: string, activityId: string) {
  return `${userId}/${activityId}.jpg`
}

// Ridimensiona e ricomprime lato client: le foto da smartphone (3-10 MB)
// diventano JPEG ~200-500 KB, ben sotto il limite del bucket.
async function compressImage(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Immagine non decodificabile'))
      el.src = objectUrl
    })
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas non disponibile')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
    if (!blob) throw new Error('Conversione JPEG fallita')
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function uploadActivityPhoto(
  userId: string,
  activityId: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> {
  let body: Blob = file
  let contentType = file.type || 'image/jpeg'
  try {
    body = await compressImage(file)
    contentType = 'image/jpeg'
  } catch {
    // Formato che il browser non decodifica: tenta l'originale, il bucket
    // rifiuta comunque i MIME non-immagine e i file oltre il limite.
  }
  if (body.size > MAX_UPLOAD_BYTES) {
    return { url: null, error: new Error('Foto troppo grande') }
  }
  const path = photoPath(userId, activityId)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { upsert: true, contentType })
  if (error) return { url: null, error }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  // Cache-buster: alla sostituzione il path resta lo stesso (come per gli avatar)
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}

// Best effort: un file orfano nello Storage non è un problema funzionale
export async function removeActivityPhoto(userId: string, activityId: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([photoPath(userId, activityId)])
}
