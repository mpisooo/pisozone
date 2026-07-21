import { supabase } from './supabase'
import { compressImage } from './imageCompression'

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

export async function uploadActivityPhoto(
  userId: string,
  activityId: string,
  file: File,
): Promise<{ url: string | null; error: Error | null }> {
  let body: Blob = file
  let contentType = file.type || 'image/jpeg'
  try {
    body = await compressImage(file, MAX_DIMENSION, JPEG_QUALITY)
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
