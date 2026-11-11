import { describe, expect, it } from 'vitest'
import { extractValidationErrors, isAlreadyInListError } from '../../app/utils/validation'

// Forme d'une FetchError d'ofetch : statusCode + data (corps JSON de la reponse).
function fetchError(statusCode: number, data?: unknown) {
  return Object.assign(new Error('fetch failed'), { statusCode, data })
}

describe('isAlreadyInListError', () => {
  it('renvoie true pour une 422 dont les erreurs n\'ont pas de champ', () => {
    const error = fetchError(422, { errors: [{ message: 'Already in list' }] })
    expect(isAlreadyInListError(error)).toBe(true)
  })

  // Voir le commentaire `shortcut:` dans app/utils/validation.ts.
  it('limite connue : renvoie aussi true pour une 422 sans champ d\'une autre exception (ChaptersExceedTotalException)', () => {
    const error = fetchError(422, {
      errors: [{ message: 'Le nombre de chapitres lus depasse le total' }],
    })
    expect(isAlreadyInListError(error)).toBe(true)
  })

  it('renvoie false pour une 422 de validation avec un champ', () => {
    const error = fetchError(422, { errors: [{ field: 'status', message: 'Invalid' }] })
    expect(isAlreadyInListError(error)).toBe(false)
  })

  it('renvoie false pour une 422 dont errors est vide', () => {
    expect(isAlreadyInListError(fetchError(422, { errors: [] }))).toBe(false)
  })

  it('renvoie false pour une 422 sans errors', () => {
    expect(isAlreadyInListError(fetchError(422, {}))).toBe(false)
    expect(isAlreadyInListError(fetchError(422))).toBe(false)
  })

  it.each([404, 500])('renvoie false pour un statut %i', (status) => {
    const error = fetchError(status, { errors: [{ message: 'Erreur' }] })
    expect(isAlreadyInListError(error)).toBe(false)
  })

  it('renvoie false pour undefined, null et une erreur reseau sans statusCode', () => {
    expect(isAlreadyInListError(undefined)).toBe(false)
    expect(isAlreadyInListError(null)).toBe(false)
    expect(isAlreadyInListError(new TypeError('Failed to fetch'))).toBe(false)
  })
})

describe('extractValidationErrors', () => {
  it('associe chaque champ a son message', () => {
    const error = fetchError(422, {
      errors: [
        { field: 'title', message: 'Title required' },
        { field: 'author', message: 'Author required' },
      ],
    })
    expect(extractValidationErrors(error)).toEqual({
      title: 'Title required',
      author: 'Author required',
    })
  })

  it('garde le premier message quand un champ a plusieurs erreurs', () => {
    const error = fetchError(422, {
      errors: [
        { field: 'title', message: 'First' },
        { field: 'title', message: 'Second' },
      ],
    })
    expect(extractValidationErrors(error)).toEqual({ title: 'First' })
  })

  it('renvoie un objet vide sans corps d\'erreur exploitable', () => {
    expect(extractValidationErrors(undefined)).toEqual({})
    expect(extractValidationErrors(null)).toEqual({})
    expect(extractValidationErrors(new TypeError('Failed to fetch'))).toEqual({})
    expect(extractValidationErrors(fetchError(500, {}))).toEqual({})
  })
})
