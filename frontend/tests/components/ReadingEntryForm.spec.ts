import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ReadingEntryForm from '../../app/components/ReadingEntryForm.vue'
import ReadingProgressInput from '../../app/components/ReadingProgressInput.vue'
import type { UserWebtoon } from '../../app/types/user-webtoon'
import {
  extractBusinessError,
  formatDate,
  toDateInputValue,
  toReadingEntryPayload,
  validateChaptersRead,
  validateReadingEntry,
  type ReadingEntryFormValues,
} from '../../app/utils/reading-entry'

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
})

describe('toReadingEntryPayload', () => {
  it('omet note, commentaire vide (apres trim) et dates vides', () => {
    const payload = toReadingEntryPayload(formValues({ chaptersRead: '12', comment: '   ' }))
    expect(payload).toEqual({ status: 'reading', chaptersRead: 12 })
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

function makeEntry(overrides: Partial<UserWebtoon> = {}, chaptersTotal: number | null = 50): UserWebtoon {
  return {
    id: 'entry-1',
    userId: 'user-1',
    webtoonId: 'webtoon-1',
    status: 'reading',
    chaptersRead: 12,
    rating: null,
    comment: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    webtoon: {
      id: 'webtoon-1',
      title: 'Titre',
      author: 'Auteur',
      description: null,
      coverUrl: null,
      chaptersTotal,
      link: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      genres: [],
    },
    ...overrides,
  }
}

function mountForm(props: Record<string, unknown> = {}, entry = makeEntry()) {
  return mount(ReadingEntryForm, { props: { entry, ...props } })
}

// Ordre des champs AppInput dans le formulaire.
const CHAPTERS = 0
const RATING = 1

describe('ReadingEntryForm', () => {
  it('pre-remplit les champs depuis l\'entree (dates ISO ramenees a YYYY-MM-DD)', () => {
    const wrapper = mountForm(
      {},
      makeEntry({ rating: 8, comment: 'Bien', startedAt: '2026-01-02T00:00:00.000Z' })
    )
    const inputs = wrapper.findAll('input')
    expect(inputs[CHAPTERS].element.value).toBe('12')
    expect(inputs[RATING].element.value).toBe('8')
    expect(inputs[2].element.value).toBe('2026-01-02')
    expect(wrapper.find('textarea').element.value).toBe('Bien')
    expect(wrapper.text()).toContain('Chapitres lus (sur 50)')
  })

  it('n\'emet pas submit et affiche le message si chaptersRead depasse le total', async () => {
    const wrapper = mountForm()
    await wrapper.findAll('input')[CHAPTERS].setValue('51')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('50 chapitres au maximum')
    expect(wrapper.findAll('input')[CHAPTERS].attributes('aria-invalid')).toBe('true')
  })

  it('n\'emet pas submit si la note est hors pas de 0,5', async () => {
    const wrapper = mountForm()
    await wrapper.findAll('input')[RATING].setValue('7.3')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('par pas de 0,5')
  })

  it('emet le payload attendu, sans les champs vides', async () => {
    const wrapper = mountForm()
    await wrapper.find('select').setValue('completed')
    await wrapper.findAll('input')[CHAPTERS].setValue('50')
    await wrapper.findAll('input')[RATING].setValue('7.5')
    await wrapper.find('textarea').setValue('  Top  ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [{ status: 'completed', chaptersRead: 50, rating: 7.5, comment: 'Top' }],
    ])
  })

  it('affiche les erreurs serveur sous les champs correspondants', () => {
    const wrapper = mountForm({
      errors: { rating: 'Note serveur invalide', comment: 'Commentaire trop long' },
    })
    const ratingInput = wrapper.findAll('input')[RATING]
    const describedBy = ratingInput.attributes('aria-describedby') ?? ''
    expect(describedBy).toBeTruthy()
    expect(wrapper.find(`[id="${describedBy}"]`).text()).toBe('Note serveur invalide')

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('aria-invalid')).toBe('true')
    expect(wrapper.find(`[id="${textarea.attributes('aria-describedby') ?? ''}"]`).text()).toBe(
      'Commentaire trop long'
    )
  })

  it('affiche globalError dans un role="alert"', () => {
    const wrapper = mountForm({ globalError: 'Depasse le total' })
    expect(wrapper.find('[role="alert"]').text()).toBe('Depasse le total')
  })

  it('n\'affiche pas d\'alerte sans globalError', () => {
    expect(mountForm().find('[role="alert"]').exists()).toBe(false)
  })

  it('ignore submit et cancel pendant submitting', async () => {
    const wrapper = mountForm({ submitting: true })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('aria-disabled')).toBe('true')
    expect(buttons[1].attributes('aria-disabled')).toBe('true')
    expect(buttons[1].text()).toBe('Enregistrement...')

    await buttons[0].trigger('click')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emet cancel au clic sur Annuler, sans submit', async () => {
    const wrapper = mountForm()
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})

describe('ReadingProgressInput', () => {
  function mountInput(props: Record<string, unknown> = {}) {
    return mount(ReadingProgressInput, { props: { chaptersRead: 12, chaptersTotal: 50, ...props } })
  }

  it('emet la nouvelle valeur quand elle est valide et differente', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('20')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([[20]])
  })

  it('n\'emet rien si la valeur est inchangee', async () => {
    const wrapper = mountInput()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('false')
  })

  it('n\'emet rien et affiche l\'erreur si la valeur depasse le total', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('51')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('50 chapitres au maximum')
  })

  it('n\'emet rien si la valeur est vide', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('n\'emet rien quand disabled', async () => {
    const wrapper = mountInput({ disabled: true })
    await wrapper.find('input').setValue('20')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('se recale sur la prop et efface l\'erreur quand chaptersRead change', async () => {
    const wrapper = mountInput()
    await wrapper.find('input').setValue('51')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')

    await wrapper.setProps({ chaptersRead: 13 })
    await nextTick()
    expect(wrapper.find('input').element.value).toBe('13')
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('false')
  })
})
