// Ridimensiona e ricomprime lato client un'immagine scelta dall'utente:
// condiviso da activityPhotos.ts e groupPhotos.ts (stessa esigenza, bucket
// diversi) — le foto da smartphone (3-10 MB) diventano JPEG molto più leggeri.
export async function compressImage(file: File, maxDimension: number, quality: number): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Immagine non decodificabile'))
      el.src = objectUrl
    })
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas non disponibile')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )
    if (!blob) throw new Error('Conversione JPEG fallita')
    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
