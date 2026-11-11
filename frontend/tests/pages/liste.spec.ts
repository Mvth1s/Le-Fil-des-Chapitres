import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import ListePage from '~/pages/liste/index.vue'
import type { UserWebtoon, UserWebtoonStatus } from '~/types/user-webtoon'

function makeEntry(n: number, status: UserWebtoonStatus = 'reading', chaptersRead = 5): UserWebtoon {
  return {
    id: `entry-${String(n)}`,
    userId: 'user-1',
    webtoonId: `webtoon-${String(n)}`,
    status,
    chaptersRead,
    rating: null,
    comment: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    webtoon: {
      id: `webtoon-${String(n)}`,
      title: `Titre ${String(n)}`,
      author: 'Auteur',
      description: null,
      coverUrl: null,
      chaptersTotal: 13,
      link: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      genres: [],
    },
  }
}

// Liste servie par le faux useFetch et faux $fetch (vi.hoisted : la fabrique
// de mockNuxtImport est remontee en tete de fichier).
const { state, fetchMock } = vi.hoisted(() => ({
  state: { entries: [] as UserWebtoon[] },
  fetchMock: vi.fn(),
}))

mockNuxtImport('useFetch', () => () =>
  Promise.resolve({
    data: ref(state.entries),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  })
)
mockNuxtImport('$fetch', () => fetchMock)

beforeEach(() => {
  state.entries = []
  fetchMock.mockReset()
  useToast().toasts.value = []
})

afterEach(() => {
  document.body.innerHTML = ''
})

type Wrapper = VueWrapper

function mountPage() {
  return mountSuspended(ListePage, { attachTo: document.body })
}

function tabs(wrapper: Wrapper) {
  return wrapper.findAll('[role="group"][aria-label="Statut"] button')
}

function tab(wrapper: Wrapper, label: string) {
  const button = tabs(wrapper).find((b) => b.text().startsWith(label))
  if (!button) throw new Error(`onglet introuvable : ${label}`)
  return button
}

function cardTitles(wrapper: Wrapper) {
  return wrapper.findAll('.wt-grid .wt-card__open').map((b) => b.text())
}

function count(wrapper: Wrapper) {
  return wrapper.get('.toolbar__count').text()
}

// Les modales sont teleportees dans body : recherche hors du wrapper.
function dialog(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="dialog"]')
}

function dialogButton(label: string) {
  const button = Array.from(dialog()?.querySelectorAll<HTMLElement>('button') ?? []).find(
    (b) => b.textContent.trim() === label
  )
  if (!button) throw new Error(`bouton de modale introuvable : ${label}`)
  return button
}

async function openCard(wrapper: Wrapper, title: string) {
  const card = wrapper.findAll('.wt-card__open').find((b) => b.text() === title)
  if (!card) throw new Error(`carte introuvable : ${title}`)
  await card.trigger('click')
  await flushPromises()
}

async function submitEdit() {
  dialog()?.querySelector('form')?.dispatchEvent(new Event('submit'))
  await flushPromises()
}

function toastMessages() {
  return useToast().toasts.value.map((toast) => toast.message)
}

const SAMPLE = () => [
  makeEntry(1),
  makeEntry(2, 'reading', 12),
  makeEntry(3, 'completed', 13),
  makeEntry(4, 'plan_to_read', 0),
  makeEntry(5, 'dropped'),
]

describe('page liste : onglets de statut', () => {
  it('six onglets dans l ordre du UI kit, "Tous" actif par defaut', async () => {
    state.entries = SAMPLE()
    const wrapper = await mountPage()
    const labels = tabs(wrapper).map((b) => b.text().replace(/\s*\d+$/, ''))
    expect(labels).toEqual(['Tous', 'En cours', 'Terminés', 'En pause', 'À lire', 'Abandonnés'])
    expect(tabs(wrapper).map((b) => b.attributes('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
      'false',
    ])
  })

  it('les compteurs portent sur la liste complete et ignorent les filtres', async () => {
    state.entries = SAMPLE()
    const wrapper = await mountPage()
    const counts = () => tabs(wrapper).map((b) => b.get('.tab__count').text())
    expect(counts()).toEqual(['5', '2', '1', '0', '1', '1'])

    // Note minimale 9 : aucun titre ne passe le filtre (notes nulles).
    await wrapper.findAll('section.filters select')[1]!.setValue('9')
    expect(count(wrapper)).toBe('0 titre')
    expect(counts()).toEqual(['5', '2', '1', '0', '1', '1'])
  })

  it('un clic sur un onglet filtre la grille et deplace aria-pressed', async () => {
    state.entries = SAMPLE()
    const wrapper = await mountPage()
    expect(cardTitles(wrapper)).toHaveLength(5)

    await tab(wrapper, 'En cours').trigger('click')
    expect(tab(wrapper, 'En cours').attributes('aria-pressed')).toBe('true')
    expect(tab(wrapper, 'Tous').attributes('aria-pressed')).toBe('false')
    expect(cardTitles(wrapper)).toEqual(['Titre 1', 'Titre 2'])

    await tab(wrapper, 'Terminés').trigger('click')
    expect(cardTitles(wrapper)).toEqual(['Titre 3'])
  })
})

describe('page liste : etats vides', () => {
  it('liste vide : invitation et lien vers le catalogue, sans onglets', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Ta liste est vide')
    expect(wrapper.find('.empty a[href="/catalogue"]').exists()).toBe(true)
    expect(tabs(wrapper)).toHaveLength(0)
  })

  it('onglet sans titre : message propre au statut, sans reinitialisation', async () => {
    state.entries = SAMPLE()
    const wrapper = await mountPage()
    await tab(wrapper, 'En pause').trigger('click')
    expect(wrapper.find('.empty h2').text()).toBe('Aucun titre en pause')
    expect(wrapper.find('.empty button').exists()).toBe(false)
    expect(cardTitles(wrapper)).toHaveLength(0)
  })

  it('filtres sans resultat : "Aucun résultat" et reinitialisation', async () => {
    state.entries = SAMPLE()
    const wrapper = await mountPage()
    await wrapper.findAll('section.filters select')[1]!.setValue('9')
    expect(wrapper.text()).toContain('Aucun résultat')

    const reset = wrapper.findAll('.empty button').find((b) => b.text() === 'Réinitialiser les filtres')
    expect(reset).toBeDefined()
    await reset!.trigger('click')
    expect(count(wrapper)).toBe('5 titres')
    expect(cardTitles(wrapper)).toHaveLength(5)
  })
})

describe('page liste : edition dans la modale', () => {
  it('un clic sur la carte ouvre la modale avec le lien vers la fiche', async () => {
    state.entries = SAMPLE()
    const wrapper = await mountPage()
    expect(dialog()).toBeNull()

    await openCard(wrapper, 'Titre 2')
    expect(dialog()?.textContent).toContain('Modifier ma lecture')
    expect(dialog()?.textContent).toContain('Titre 2')
    expect(dialog()?.querySelector('a[href="/catalogue/webtoon-2"]')?.textContent.trim()).toBe(
      'Voir la fiche du webtoon'
    )
  })

  it('Enregistrer envoie un PUT, met la carte a jour, ferme la modale et affiche un toast', async () => {
    state.entries = SAMPLE()
    fetchMock.mockResolvedValue({ ...makeEntry(1), chaptersRead: 8 })
    const wrapper = await mountPage()

    await openCard(wrapper, 'Titre 1')
    await submitEdit()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, { method: string; body: object }]
    expect(url).toBe('/api/user/list/entry-1')
    expect(options.method).toBe('PUT')
    expect(options.body).toMatchObject({ status: 'reading', chaptersRead: 5 })
    expect(dialog()).toBeNull()
    expect(toastMessages()).toContain('Ta lecture a été mise à jour.')
    expect(wrapper.text()).toContain('Ch. 8')
  })

  it('erreur 422 de validation : message sous le champ, modale ouverte', async () => {
    state.entries = SAMPLE()
    fetchMock.mockRejectedValue({
      statusCode: 422,
      data: { errors: [{ field: 'rating', message: 'La note doit être comprise entre 0 et 10.' }] },
    })
    const wrapper = await mountPage()

    await openCard(wrapper, 'Titre 1')
    await submitEdit()

    expect(dialog()?.textContent).toContain('La note doit être comprise entre 0 et 10.')
    expect(toastMessages()).toEqual([])
  })

  it('erreur metier sans champ : message global en role="alert"', async () => {
    state.entries = SAMPLE()
    fetchMock.mockRejectedValue({
      statusCode: 422,
      data: { errors: [{ message: 'Les chapitres lus dépassent le total.' }] },
    })
    const wrapper = await mountPage()

    await openCard(wrapper, 'Titre 1')
    await submitEdit()

    expect(dialog()?.querySelector('[role="alert"]')?.textContent.trim()).toBe(
      'Les chapitres lus dépassent le total.'
    )
  })
})

describe('page liste : retrait', () => {
  it('la confirmation remplace l edition, puis DELETE retire la carte', async () => {
    state.entries = SAMPLE()
    fetchMock.mockResolvedValue(undefined)
    const wrapper = await mountPage()

    await openCard(wrapper, 'Titre 2')
    dialogButton('Retirer de ma liste').click()
    await flushPromises()

    // Une seule modale a la fois : la confirmation, pas le formulaire.
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1)
    expect(dialog()?.textContent).toContain('Retirer ce webtoon de ta liste ?')
    expect(dialog()?.querySelector('form')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()

    dialogButton('Retirer').click()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/user/list/entry-2', { method: 'DELETE' })
    expect(dialog()).toBeNull()
    expect(cardTitles(wrapper)).not.toContain('Titre 2')
    expect(tab(wrapper, 'Tous').get('.tab__count').text()).toBe('4')
    expect(toastMessages()).toContain('Webtoon retiré de ta liste.')
  })
})

describe('page liste : +1 chapitre', () => {
  it('+1 qui termine une entree dans "En cours" : la carte sort, focus sur la suivante', async () => {
    const entries = [makeEntry(1), makeEntry(2, 'reading', 12), makeEntry(3)]
    state.entries = entries
    fetchMock.mockResolvedValue({ ...entries[1], chaptersRead: 13, status: 'completed' })
    const wrapper = await mountPage()

    await tab(wrapper, 'En cours').trigger('click')
    await wrapper.find('button[aria-label="+1 chapitre, Titre 2"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/user/list/entry-2/progress', {
      method: 'PATCH',
      body: { chaptersRead: 13 },
    })
    expect(cardTitles(wrapper)).toEqual(['Titre 1', 'Titre 3'])
    expect(document.activeElement?.textContent.trim()).toBe('Titre 3')
    expect(tab(wrapper, 'Terminés').get('.tab__count').text()).toBe('1')
    expect(wrapper.find('p.sr-only[aria-live="polite"]').text()).toContain(
      "Titre 2 : terminé, retiré de l'onglet En cours."
    )
  })
})
