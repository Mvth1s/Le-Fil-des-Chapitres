import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ReadingEntryForm from '~/components/ReadingEntryForm.vue'
import type { UserWebtoon } from '~/types/user-webtoon'

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
const STARTED_AT = 2
const FINISHED_AT = 3

// Acces indexe sur : echoue clairement si le champ attendu n'est pas rendu.
function at<T>(list: T[], index: number): T {
  const item = list[index]
  if (item === undefined) throw new Error(`Aucun element a l'index ${String(index)}`)
  return item
}

describe('ReadingEntryForm', () => {
  it('pre-remplit les champs depuis l\'entree (dates ISO ramenees a YYYY-MM-DD)', () => {
    const wrapper = mountForm(
      {},
      makeEntry({ rating: 8, comment: 'Bien', startedAt: '2026-01-02T00:00:00.000Z' })
    )
    const inputs = wrapper.findAll('input')
    expect(at(inputs, CHAPTERS).element.value).toBe('12')
    expect(at(inputs, RATING).element.value).toBe('8')
    expect(at(inputs, STARTED_AT).element.value).toBe('2026-01-02')
    expect(wrapper.find('textarea').element.value).toBe('Bien')
    expect(wrapper.text()).toContain('Chapitres lus (sur 50)')
  })

  it('n\'emet pas submit et affiche le message si chaptersRead depasse le total', async () => {
    const wrapper = mountForm()
    await at(wrapper.findAll('input'), CHAPTERS).setValue('51')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('50 chapitres au maximum')
    expect(at(wrapper.findAll('input'), CHAPTERS).attributes('aria-invalid')).toBe('true')
  })

  it('n\'emet pas submit si la note est hors pas de 0,5', async () => {
    const wrapper = mountForm()
    await at(wrapper.findAll('input'), RATING).setValue('7.3')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('par pas de 0,5')
  })

  it('emet le payload attendu, avec null pour les champs vides', async () => {
    const wrapper = mountForm()
    await wrapper.find('select').setValue('completed')
    await at(wrapper.findAll('input'), CHAPTERS).setValue('50')
    await at(wrapper.findAll('input'), RATING).setValue('7.5')
    await wrapper.find('textarea').setValue('  Top  ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          status: 'completed',
          chaptersRead: 50,
          rating: 7.5,
          comment: 'Top',
          startedAt: null,
          finishedAt: null,
        },
      ],
    ])
  })

  it('emet null pour les champs deja renseignes puis vides', async () => {
    const wrapper = mountForm(
      {},
      makeEntry({ rating: 8, comment: 'Bien', startedAt: '2026-01-02', finishedAt: '2026-02-03' })
    )
    const inputs = wrapper.findAll('input')
    await at(inputs, RATING).setValue('')
    await at(inputs, STARTED_AT).setValue('')
    await at(inputs, FINISHED_AT).setValue('')
    await wrapper.find('textarea').setValue('  ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          status: 'reading',
          chaptersRead: 12,
          rating: null,
          comment: null,
          startedAt: null,
          finishedAt: null,
        },
      ],
    ])
  })

  it('n\'emet pas submit si la date de fin precede la date de debut', async () => {
    const wrapper = mountForm()
    const inputs = wrapper.findAll('input')
    await at(inputs, STARTED_AT).setValue('2026-03-04')
    await at(inputs, FINISHED_AT).setValue('2026-03-03')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('La date de fin ne peut pas précéder la date de début.')
    expect(at(inputs, FINISHED_AT).attributes('aria-invalid')).toBe('true')
  })

  it('focalise le premier champ en erreur apres un echec de validation', async () => {
    const wrapper = mount(ReadingEntryForm, { props: { entry: makeEntry() }, attachTo: document.body })
    const inputs = wrapper.findAll('input')
    await at(inputs, RATING).setValue('7.3')
    await at(inputs, STARTED_AT).setValue('2026-03-04')
    await at(inputs, FINISHED_AT).setValue('2026-03-03')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(document.activeElement).toBe(at(inputs, RATING).element)
    wrapper.unmount()
  })

  it('affiche les erreurs serveur sous les champs correspondants', () => {
    const wrapper = mountForm({
      errors: { rating: 'Note serveur invalide', comment: 'Commentaire trop long' },
    })
    const ratingInput = at(wrapper.findAll('input'), RATING)
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
    expect(at(buttons, 0).attributes('aria-disabled')).toBe('true')
    expect(at(buttons, 1).attributes('aria-disabled')).toBe('true')
    expect(at(buttons, 1).text()).toBe('Enregistrement...')

    await at(buttons, 0).trigger('click')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emet cancel au clic sur Annuler, sans submit', async () => {
    const wrapper = mountForm()
    await at(wrapper.findAll('button'), 0).trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
