import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import WebtoonForm from '~/components/WebtoonForm.vue'
import AppCover from '~/components/AppCover.vue'
import type { Genre } from '~/types/webtoon'

const GENRES: Genre[] = [
  { id: 'genre-action', name: 'Action', slug: 'action' },
  { id: 'genre-romance', name: 'Romance', slug: 'romance' },
]

// Le type du SFC n'est pas resolu par typescript-eslint : on type le wrapper.
function mountForm(props: Record<string, unknown> = {}): VueWrapper {
  return mount(WebtoonForm, {
    props: { genres: GENRES, submitLabel: 'Enregistrer', ...props },
  }) as VueWrapper
}

// Ordre des AppInput : titre, auteur, couverture, chapitres, lien.
function inputs(wrapper: VueWrapper) {
  return wrapper.findAll('input.app-input__field')
}

function coverInput(wrapper: VueWrapper) {
  const input = inputs(wrapper)[2]
  if (!input) throw new Error('champ couverture introuvable')
  return input
}

function previewSrc(wrapper: VueWrapper) {
  return wrapper.findComponent(AppCover).props('src') as unknown
}

// Saisie puis attente du debounce (300 ms).
async function typeCover(wrapper: VueWrapper, value: string) {
  await coverInput(wrapper).setValue(value)
  vi.advanceTimersByTime(300)
  await nextTick()
}

function warning(wrapper: VueWrapper) {
  return wrapper.find('[role="status"] .webtoon-form__warning')
}

afterEach(() => {
  vi.useRealTimers()
})

describe('WebtoonForm : apercu de la couverture', () => {
  it('src = null quand l URL est vide', () => {
    expect(previewSrc(mountForm())).toBeNull()
  })

  it.each(['pas une url', 'http://exemple.test/c.jpg'])('src = null pour %s', async (value) => {
    vi.useFakeTimers()
    const wrapper = mountForm()
    await typeCover(wrapper, value)
    expect(previewSrc(wrapper)).toBeNull()
  })

  it('transmet l URL https apres 300 ms, pas avant', async () => {
    vi.useFakeTimers()
    const wrapper = mountForm()
    await coverInput(wrapper).setValue('https://exemple.test/c.jpg')
    vi.advanceTimersByTime(299)
    await nextTick()
    expect(previewSrc(wrapper)).toBeNull()

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(previewSrc(wrapper)).toBe('https://exemple.test/c.jpg')
  })

  it.each(['http://exemple.test/c.jpg', 'HTTP://exemple.test/c.jpg'])(
    'avertissement pour %s',
    async (value) => {
      vi.useFakeTimers()
      const wrapper = mountForm()
      await typeCover(wrapper, value)
      expect(warning(wrapper).exists()).toBe(true)
    }
  )

  it('pas d avertissement pour https, region live toujours presente', async () => {
    vi.useFakeTimers()
    const wrapper = mountForm()
    await typeCover(wrapper, 'https://exemple.test/c.jpg')
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(warning(wrapper).exists()).toBe(false)
  })
})

describe('WebtoonForm : soumission', () => {
  it('champs optionnels vides en undefined, genres coches', async () => {
    const wrapper = mountForm()
    await inputs(wrapper)[0]!.setValue('Solo Leveling')
    await inputs(wrapper)[1]!.setValue('Chugong')
    await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          title: 'Solo Leveling',
          author: 'Chugong',
          description: undefined,
          coverUrl: undefined,
          chaptersTotal: undefined,
          link: undefined,
          genreIds: ['genre-romance'],
        },
      ],
    ])
  })

  it('valeurs renseignees : trim et nombre de chapitres en Number', async () => {
    const wrapper = mountForm()
    await inputs(wrapper)[0]!.setValue('Titre')
    await inputs(wrapper)[1]!.setValue('Auteur')
    await wrapper.get('textarea').setValue('  Une histoire  ')
    await coverInput(wrapper).setValue(' https://exemple.test/c.jpg ')
    await inputs(wrapper)[3]!.setValue('120')
    await inputs(wrapper)[4]!.setValue('https://exemple.test/lire')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({
      title: 'Titre',
      author: 'Auteur',
      description: 'Une histoire',
      coverUrl: 'https://exemple.test/c.jpg',
      chaptersTotal: 120,
      link: 'https://exemple.test/lire',
      genreIds: [],
    })
  })
})

describe('WebtoonForm : erreurs', () => {
  it('affiche les erreurs description et genreIds, aria-invalid sur la textarea', () => {
    const wrapper = mountForm({
      errors: { description: 'Trop longue', genreIds: 'Genre inconnu' },
    })
    const textarea = wrapper.get('textarea')
    expect(textarea.attributes('aria-invalid')).toBe('true')
    expect(textarea.attributes('aria-describedby')).toBe('webtoon-description-error')
    expect(wrapper.get('#webtoon-description-error').text()).toBe('Trop longue')
    expect(wrapper.get('fieldset .webtoon-form__error').text()).toBe('Genre inconnu')
  })

  it('sans erreur : textarea non invalide', () => {
    const textarea = mountForm().get('textarea')
    expect(textarea.attributes('aria-invalid')).toBe('false')
    expect(textarea.attributes('aria-describedby')).toBeUndefined()
  })
})
