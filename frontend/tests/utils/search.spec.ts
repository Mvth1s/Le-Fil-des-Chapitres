import { describe, expect, it } from 'vitest'
import { normalizeSearch } from '~/utils/search'

describe('normalizeSearch', () => {
  it('met en minuscules', () => {
    expect(normalizeSearch('Solo LEVELING')).toBe('solo leveling')
  })

  it('retire les accents', () => {
    expect(normalizeSearch('é è ê à ç ï ô ñ')).toBe('e e e a c i o n')
  })

  it('retire les accents des majuscules', () => {
    expect(normalizeSearch('ÉLÈVE ÇA ÎLE')).toBe('eleve ca ile')
  })

  it('supprime les espaces en debut et fin', () => {
    expect(normalizeSearch('  Tower of God  ')).toBe('tower of god')
  })

  it('renvoie une chaine vide pour une entree vide ou blanche', () => {
    expect(normalizeSearch('')).toBe('')
    expect(normalizeSearch('   ')).toBe('')
  })
})
