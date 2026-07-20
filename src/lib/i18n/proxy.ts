import { getLanguage } from './language'

// `it` è sempre `as const`: ogni stringa foglia diventa un tipo literal
// (es. 'Salva', non `string`), quindi `typeof it` non può accogliere il
// testo inglese ('Save' non è assegnabile al tipo 'Salva'). Widen allarga
// SOLO le foglie stringa a `string`, lasciando struttura/nesting/array e
// arità di funzione identici — le chiavi mancanti o in eccesso restano un
// errore di compilazione, il contenuto letterale no. Il valore di ritorno
// delle funzioni va allargato ricorsivamente: un ternario dentro `as const`
// (es. `n === 1 ? 'giorno' : 'giorni'`) viene inferito come union di literal,
// non come `string`.
export type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends object
        ? { [K in keyof T]: Widen<T[K]> }
        : T

// Ogni namespace esporta `createNamespaceProxy(it, en)` invece dell'oggetto
// italiano nudo: il target del Proxy resta `it`, quindi tutte le trap di
// default (ownKeys, getOwnPropertyDescriptor, has) restano corrette gratis —
// serve solo intercettare `get` per scegliere la lingua attiva al momento
// della lettura, non dell'import.
export function createNamespaceProxy<T extends object>(it: T, en: Widen<T>): T {
  return new Proxy(it, {
    get(_target, prop, receiver) {
      const source = getLanguage() === 'en' ? en : it
      return Reflect.get(source as object, prop, receiver)
    },
  })
}
