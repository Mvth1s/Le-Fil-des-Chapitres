import { describe, expect, it } from 'vitest'
import {
  extractBusinessError,
  formatDate,
  toDateInputValue,
  toReadingEntryPayload,
  validateChaptersRead,
  validateReadingEntry,
  type ReadingEntryFormValues,
} from '~/utils/reading-entry'

function formValues(overrides: Partial<ReadingEntryFormValues> = {}): ReadingEntryFormValues {
  return {
    status: 'reading',
    chaptersRead: 12,
    rating: '',
    comment: '',
    startedAt: '',
    finishedAt: '',
    ...overrides,
  }
}

// Forme d'une FetchError d'ofetch : statusCode + data (corps JSON de la reponse).
function fetchError(statusCode: number, data?: unknown) {
  return Object.assign(new Error('fetch failed'), { statusCode, data })
}

describe('validateChaptersRead', () => {
  it('refuse une valeur vide', () => {
    expect(validateChaptersRead('', 50)).not.toBe('')
    expect(validateChaptersRead('   ', 50)).not.toBe('')
  })

  it('refuse un nombre non entier', () => {
    expect(validateChaptersRead('3.5', 50)).not.toBe('')
    expect(validateChaptersRead('abc', 50)).not.toBe('')
  })

  it('refuse un nombre negatif', () => {
    expect(validateChaptersRead(-1, 50)).not.toBe('')
  })

  it('refuse un nombre superieur au total et cite le total', () => {
    expect(validateChaptersRead(51, 50)).toContain('50')
  })

  it('accepte le total exact et zero', () => {
    expect(validateChaptersRead(50, 50)).toBe('')
    expect(validateChaptersRead(0, 50)).toBe('')
  })

  it('ne borne pas quand le total est inconnu (null)', () => {
    expect(validateChaptersRead(9999, null)).toBe('')
  })

  it('accepte une valeur valide saisie en chaine', () => {
    expect(validateChaptersRead('12', 50)).toBe('')
  })
})

describe('validateReadingEntry', () => {
  it('ne renvoie aucune erreur pour des valeurs valides sans note', () => {
    expect(validateReadingEntry(formValues(), 50)).toEqual({})
  })

  it.each([7.5, '7.5', 0, 10])('accepte la note %s', (rating) => {
    expect(validateReadingEntry(formValues({ rating }), 50)).toEqual({})
  })

  it.each([7.3, 10.5, -1, 'abc'])('refuse la note %s', (rating) => {
    expect(validateReadingEntry(formValues({ rating }), 50)).toHaveProperty('rating')
  })

  it('remonte l\'erreur de chapitres sous la cle chaptersRead', () => {
    const errors = validateReadingEntry(formValues({ chaptersRead: 51 }), 50)
    expect(Object.keys(errors)).toEqual(['chaptersRead'])
  })

  it('refuse une date de fin anterieure a la date de debut', () => {
    const errors = validateReadingEntry(
      formValues({ startedAt: '2026-03-04', finishedAt: '2026-03-03' }),
      50
    )
    expect(Object.keys(errors)).toEqual(['finishedAt'])
  })

  it('accepte des dates egales ou une seule date renseignee', () => {
    expect(validateReadingEntry(formValues({ startedAt: '2026-03-04', finishedAt: '2026-03-04' }), 50)).toEqual({})
    expect(validateReadingEntry(formValues({ finishedAt: '2026-03-04' }), 50)).toEqual({})
  })
})

describe('toReadingEntryPayload', () => {
  it('envoie null pour note, commentaire vide (apres trim) et dates vides', () => {
    const payload = toReadingEntryPayload(formValues({ chaptersRead: '12', comment: '   ' }))
    expect(payload).toEqual({
      status: 'reading',
      chaptersRead: 12,
      rating: null,
      comment: null,
      startedAt: null,
      finishedAt: null,
    })
  })

  it('convertit les nombres et garde les champs renseignes, commentaire trimme', () => {
    const payload = toReadingEntryPayload(
      formValues({
        status: 'completed',
        chaptersRead: '50',
        rating: '8.5',
        comment: '  Super  ',
        startedAt: '2026-01-02',
        finishedAt: '2026-03-04',
      })
    )
    expect(payload).toEqual({
      status: 'completed',
      chaptersRead: 50,
      rating: 8.5,
      comment: 'Super',
      startedAt: '2026-01-02',
      finishedAt: '2026-03-04',
    })
  })
})

describe('extractBusinessError', () => {
  it('renvoie le message d\'une 422 sans champ', () => {
    const error = fetchError(422, { errors: [{ message: 'Depasse le total' }] })
    expect(extractBusinessError(error)).toBe('Depasse le total')
  })

  it('renvoie null pour une 422 de validation par champ', () => {
    const error = fetchError(422, { errors: [{ field: 'rating', message: 'Invalide' }] })
    expect(extractBusinessError(error)).toBeNull()
  })

  it('renvoie null pour les autres statuts et les valeurs non erreurs', () => {
    expect(extractBusinessError(fetchError(500, { errors: [{ message: 'Boom' }] }))).toBeNull()
    expect(extractBusinessError(fetchError(404))).toBeNull()
    expect(extractBusinessError(null)).toBeNull()
    expect(extractBusinessError(undefined)).toBeNull()
  })
})

describe('toDateInputValue', () => {
  it('garde la partie YYYY-MM-DD d\'une date ou d\'un horodatage ISO', () => {
    expect(toDateInputValue('2026-01-02')).toBe('2026-01-02')
    expect(toDateInputValue('2026-01-02T23:30:00.000+00:00')).toBe('2026-01-02')
  })

  it('renvoie une chaine vide pour null', () => {
    expect(toDateInputValue(null)).toBe('')
  })
})

describe('formatDate', () => {
  it('formate en JJ/MM/AAAA', () => {
    expect(formatDate('2026-01-02')).toBe('02/01/2026')
  })

  it('ne decale pas le jour selon le fuseau (horodatage proche de minuit)', () => {
    expect(formatDate('2026-01-01T00:00:00.000Z')).toBe('01/01/2026')
    expect(formatDate('2026-12-31T23:59:59.000Z')).toBe('31/12/2026')
  })
})
