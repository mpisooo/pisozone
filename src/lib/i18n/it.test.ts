import { describe, it, expect } from 'vitest'
import strings from './index'

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

describe('dizionario i18n', () => {
  it('ogni voce di ogni namespace è una stringa non vuota o una funzione', () => {
    walk(strings, '')
  })

  it('espone tutti i namespace attesi', () => {
    const expected = [
      'common', 'shell', 'auth', 'home', 'log', 'calendar', 'stats',
      'challenges', 'medals', 'profile', 'social', 'legal',
    ]
    for (const key of expected) {
      expect(strings, `manca il namespace "${key}"`).toHaveProperty(key)
    }
  })
})
