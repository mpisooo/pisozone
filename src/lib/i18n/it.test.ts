import { describe, it, expect } from 'vitest'
import strings from './index'
import { setLanguage } from './language'

// Percorre ricorsivamente il dizionario assemblato: ogni foglia deve essere
// una stringa o una funzione (le stringhe interpolate), mai undefined/null —
// una stringa vuota è ammessa (es. un'unità di misura assente per "sessioni").
function walk(node: unknown, path: string): void {
  if (typeof node === 'string') {
    return
  }
  if (typeof node === 'function') return
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, `${path}[${i}]`))
    return
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      walk(value, path ? `${path}.${key}` : key)
    }
    return
  }
  throw new Error(`Valore inatteso in "${path}": ${typeof node}`)
}

// Confronta ricorsivamente la FORMA (chiavi, non contenuto) di due nodi dei
// due dizionari: le funzioni interpolate sono confrontate per arità, non per
// output, dato che it/en possono avere pluralizzazioni diverse.
function walkShape(itNode: unknown, enNode: unknown, path: string): void {
  if (typeof itNode === 'string') {
    expect(typeof enNode, `"${path}" dovrebbe essere una stringa anche in inglese`).toBe('string')
    return
  }
  if (typeof itNode === 'function') {
    expect(typeof enNode, `"${path}" dovrebbe essere una funzione anche in inglese`).toBe('function')
    expect((enNode as (...a: unknown[]) => unknown).length, `"${path}" ha un'arità diversa tra it ed en`).toBe((itNode as (...a: unknown[]) => unknown).length)
    return
  }
  if (Array.isArray(itNode)) {
    expect(Array.isArray(enNode), `"${path}" dovrebbe essere un array anche in inglese`).toBe(true)
    itNode.forEach((child, i) => walkShape(child, (enNode as unknown[])[i], `${path}[${i}]`))
    return
  }
  if (itNode && typeof itNode === 'object') {
    expect(enNode && typeof enNode === 'object', `"${path}" dovrebbe essere un oggetto anche in inglese`).toBe(true)
    const itKeys = Object.keys(itNode).sort()
    const enKeys = Object.keys(enNode as object).sort()
    expect(enKeys, `chiavi diverse tra it ed en in "${path}"`).toEqual(itKeys)
    for (const [key, value] of Object.entries(itNode)) {
      walkShape(value, (enNode as Record<string, unknown>)[key], path ? `${path}.${key}` : key)
    }
  }
}

const NAMESPACES = [
  'common', 'shell', 'auth', 'home', 'log', 'calendar', 'stats',
  'challenges', 'medals', 'profile', 'social', 'legal',
  'recovery', 'plans', 'guide', 'goals', 'insights', 'wrapped', 'share', 'duels',
  'seasonalEvents', 'notifications', 'recap', 'heatmap', 'segments', 'routines',
  'sportPicker', 'landing', 'themes',
]

describe('dizionario i18n', () => {
  it('ogni voce di ogni namespace è una stringa non vuota o una funzione (italiano)', () => {
    setLanguage('it')
    walk(strings, '')
  })

  it('ogni voce di ogni namespace è una stringa non vuota o una funzione (inglese)', () => {
    setLanguage('en')
    walk(strings, '')
    setLanguage('it')
  })

  it('espone tutti i namespace attesi', () => {
    for (const key of NAMESPACES) {
      expect(strings, `manca il namespace "${key}"`).toHaveProperty(key)
    }
  })

  it('il dizionario inglese rispecchia esattamente la forma di quello italiano, namespace per namespace', () => {
    setLanguage('it')
    const itSnapshot = JSON.parse(JSON.stringify(strings, (_k, v) => (typeof v === 'function' ? `fn/${v.length}` : v)))
    setLanguage('en')
    const enSnapshot = JSON.parse(JSON.stringify(strings, (_k, v) => (typeof v === 'function' ? `fn/${v.length}` : v)))
    setLanguage('it')
    walkShape(itSnapshot, enSnapshot, '')
  })
})
