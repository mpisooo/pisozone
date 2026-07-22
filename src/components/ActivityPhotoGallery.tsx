import { useEffect, useState, type ChangeEvent } from 'react'
import { Plus, X } from 'lucide-react'
import {
  fetchActivityGalleryPhotos, uploadActivityGalleryPhoto, deleteActivityGalleryPhoto,
  MAX_GALLERY_PHOTOS, type ActivityPhoto,
} from '../lib/activityPhotoGallery'
import { haptic } from '../lib/haptics'
import PhotoLightbox from './PhotoLightbox'
import log from '../lib/i18n/log'

interface Props {
  userId: string
  activityId: string
}

// Galleria multi-foto (roadmap v8, pilastro 03): striscia a scorrimento
// orizzontale sotto la copertina (che resta il singolo PhotoPickerField
// legato ad activities.photo_url). Ogni foto si carica/rimuove subito al
// tocco — non c'è un salvataggio differito come per il form principale,
// stesso pattern "mutazione immediata" di segmenti/commenti.
export default function ActivityPhotoGallery({ userId, activityId }: Props) {
  const [photos, setPhotos] = useState<ActivityPhoto[]>([])
  const [loaded, setLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchActivityGalleryPhotos(activityId).then((data) => {
      if (!cancelled) { setPhotos(data); setLoaded(true) }
    })
    return () => { cancelled = true }
  }, [activityId])

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'))
    e.target.value = ''
    const room = MAX_GALLERY_PHOTOS - photos.length
    const toUpload = files.slice(0, Math.max(0, room))
    if (toUpload.length === 0) return
    setUploading(true)
    setError(false)
    let seq = photos.length
    let failed = false
    for (const file of toUpload) {
      const { data, error: uploadError } = await uploadActivityGalleryPhoto(userId, activityId, file, seq)
      if (uploadError || !data) { failed = true; continue }
      setPhotos((prev) => [...prev, data])
      seq++
    }
    setUploading(false)
    setError(failed)
    if (!failed) haptic('success')
  }

  const handleRemove = (photo: ActivityPhoto) => {
    haptic('light')
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    deleteActivityGalleryPhoto(userId, activityId, photo)
  }

  if (!loaded) return null

  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{log.gallery.title}</p>
      <div className="flex gap-2 overflow-x-auto overscroll-contain pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {photos.map((p) => (
          <div key={p.id} className="relative flex-shrink-0">
            <button type="button" onClick={() => setLightboxUrl(p.url)} className="block">
              <img src={p.url} alt={log.gallery.photoAlt} className="w-20 h-20 object-cover rounded-xl" />
            </button>
            <button
              type="button"
              onClick={() => handleRemove(p)}
              aria-label={log.gallery.removeAria}
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full text-white tap"
              style={{ background: 'rgba(0,0,0,0.65)' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {photos.length < MAX_GALLERY_PHOTOS && (
          <label
            htmlFor={`gallery-add-${activityId}`}
            aria-label={log.gallery.addAria}
            className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center cursor-pointer text-gray-400 hover:text-white transition-colors"
            style={{ border: '1px dashed var(--grey-light)', background: 'var(--grey)' }}
          >
            <Plus size={20} />
          </label>
        )}
      </div>
      {uploading && <p className="text-[11px] text-gray-500 mt-1">{log.gallery.uploading}</p>}
      {error && <p className="text-[11px] text-[var(--red)] mt-1">{log.gallery.uploadFailed}</p>}
      <input
        id={`gallery-add-${activityId}`}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFiles}
      />
      {lightboxUrl && (
        <PhotoLightbox url={lightboxUrl} alt={log.gallery.photoAlt} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}
