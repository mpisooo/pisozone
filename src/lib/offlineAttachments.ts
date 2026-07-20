import type { ExerciseEntry } from './exerciseSets'

// Foto ed esercizi allegati mentre offline (roadmap v3, pilastro 04, "offline
// senza asterischi"): non hanno un id reale finché la coda in useActivities
// non sincronizza, quindi non possono viaggiare nel payload JSON di
// offlineQueue (localStorage) — una foto è un Blob, non serializzabile in
// JSON.stringify. Questo modulo li tiene in IndexedDB, indicizzati per
// localId della coda, e flushQueue li applica appena l'attività ottiene un id
// vero, con lo stesso pattern "best effort dopo l'insert" usato ovunque.
const DB_NAME = 'pisozone-offline'
const DB_VERSION = 1
const STORE = 'pending-attachments'

export interface PendingAttachments {
  localId: string
  photoFile?: File
  exerciseEntries?: ExerciseEntry[]
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'localId' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// IndexedDB può mancare o essere disabilitato (Safari in navigazione privata):
// ogni funzione fallisce in silenzio, best effort come saveQueue in
// localStorage — perdere un allegato è meno grave che perdere l'attività.
export async function savePendingAttachments(entry: PendingAttachments): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // best effort
  }
}

export async function loadPendingAttachments(localId: string): Promise<PendingAttachments | null> {
  try {
    const db = await openDb()
    const result = await new Promise<PendingAttachments | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(localId)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return result
  } catch {
    return null
  }
}

export async function deletePendingAttachments(localId: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(localId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // best effort
  }
}
