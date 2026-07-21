import { supabase } from './supabase'
import { compressImage } from './imageCompression'

// Foto di gruppo (roadmap v6, pilastro 01 "Gruppi vivi"): bucket pubblico
// "group-photos", un solo file per gruppo al path stabile {groupId}/photo.jpg
// (upsert = sostituzione). Scrittura ammessa dalla RLS (v49) solo a chi è
// admin di quel gruppo. Stesso pattern di compressione di activityPhotos.ts.
const BUCKET = 'group-photos'
const MAX_DIMENSION = 800
const JPEG_QUALITY = 0.85
// Deve combaciare con file_size_limit del bucket (migrazione v49)
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function photoPath(groupId: string) {
  return `${groupId}/photo.jpg`
}

export async function uploadGroupPhoto(
  groupId: string,
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
  const path = photoPath(groupId)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { upsert: true, contentType })
  if (error) return { url: null, error }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}
