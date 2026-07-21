import { Camera, X } from 'lucide-react'
import log from '../lib/i18n/log'

// Campo foto riusato da Log (nuova attività) e ActivityEditModal (modifica).
// Controllato dal parent: qui vivono solo l'input file e l'anteprima.
export default function PhotoPickerField({
  previewUrl, onSelect, onClear, inputId,
}: {
  previewUrl: string | null
  onSelect: (file: File) => void
  onClear: () => void
  inputId: string
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) onSelect(file)
    // Permette di riselezionare lo stesso file dopo una rimozione
    e.target.value = ''
  }

  return (
    <div>
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt={log.photoPicker.previewAlt}
            className="w-full max-h-64 object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={onClear}
            aria-label={log.photoPicker.removeAria}
            className="absolute top-2 right-2 p-1.5 rounded-full text-white tap"
            style={{ background: 'rgba(0,0,0,0.65)' }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer text-sm text-gray-400 transition-colors hover:text-white"
          style={{ border: '1px dashed var(--grey-light)', background: 'var(--grey)' }}
        >
          <Camera size={17} />
          {log.photoPicker.addPhoto}
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  )
}
