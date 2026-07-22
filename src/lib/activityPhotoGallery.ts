import { supabase } from './supabase'
import { compressImage } from './imageCompression'

// Galleria multi-foto di un'attività (roadmap v8, pilastro 03): la copertina
// (activities.photo_url, v27, gestita da lib/activityPhotos.ts) resta
// invariata — questo modulo copre SOLO le foto aggiuntive, in activity_photos
// (v51). Stesso bucket "activity-photos", path a due livelli
// {userId}/{activityId}/{photoId}.jpg: le policy Storage esistenti guardano
// solo il primo segmento del path, quindi non serve toccarle.
const BUCKET = 'activity-photos'
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82
// Deve combaciare con file_size_limit del bucket (migrazione v27)
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MAX_GALLERY_PHOTOS = 6

export interface ActivityPhoto {
  id: string
  url: string
  seq: number
}

function galleryPath(userId: string, activityId: string, photoId: string) {
  return `${userId}/${activityId}/${photoId}.jpg`
}

// Tollerante pre-migrazione: la tabella può non esistere ancora, e non deve
// far sparire il resto della modale — pre-migrazione non c'è comunque nessuna
// foto di galleria da mostrare.
export async function fetchActivityGalleryPhotos(activityId: string): Promise<ActivityPhoto[]> {
  const { data, error } = await supabase
    .from('activity_photos')
    .select('id, url, seq')
    .eq('activity_id', activityId)
    .order('seq')
  if (error || !data) return []
  return data as ActivityPhoto[]
}

export async function uploadActivityGalleryPhoto(
  userId: string,
  activityId: string,
  file: File,
  seq: number,
): Promise<{ data: ActivityPhoto | null; error: Error | null }> {
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
    return { data: null, error: new Error('Foto troppo grande') }
  }
  const photoId = crypto.randomUUID()
  const path = galleryPath(userId, activityId, photoId)
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, body, { contentType })
  if (uploadError) return { data: null, error: uploadError }
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const { data: row, error: insertError } = await supabase
    .from('activity_photos')
    .insert({ id: photoId, activity_id: activityId, user_id: userId, url: pub.publicUrl, seq })
    .select('id, url, seq')
    .single()
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path])
    return { data: null, error: insertError }
  }
  return { data: row as ActivityPhoto, error: null }
}

// Best effort come removeActivityPhoto: un file orfano nello Storage non è
// un problema funzionale.
export async function deleteActivityGalleryPhoto(userId: string, activityId: string, photo: ActivityPhoto): Promise<void> {
  await supabase.storage.from(BUCKET).remove([galleryPath(userId, activityId, photo.id)])
  await supabase.from('activity_photos').delete().eq('id', photo.id)
}

// Pulizia manuale allo stesso titolo di removeActivityPhoto: la cascata DB
// elimina le righe, ma non i file nello Storage. Va chiamata PRIMA della
// cancellazione dell'attività (useActivities.deleteActivity) — dopo, la
// cascata ha già svuotato activity_photos e non c'è più nulla da elencare.
export async function removeActivityGalleryFiles(userId: string, activityId: string): Promise<void> {
  const photos = await fetchActivityGalleryPhotos(activityId)
  if (photos.length === 0) return
  await supabase.storage.from(BUCKET).remove(photos.map((p) => galleryPath(userId, activityId, p.id)))
}
