import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import CataloguePage from '~/pages/catalogue/index.vue'
import type { Webtoon } from '~/types/webtoon'
import type { UserWebtoon } from '~/types/user-webtoon'

const WEBTOON: Webtoon = {
  id: 'webtoon-1',
  title: 'Solo Leveling',
  author: 'Chugong',
  description: null,
  coverUrl: null,
  chaptersTotal: 200,
  link: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  genres: [],
}

const WEBTOON_2: Webtoon = {
  ...WEBTOON,
  id: 'webtoon-2',
  title: 'True Beauty',
  author: 'Yaongyi',
  genres: [{ id: 'genre-romance', name: 'Romance', slug: 'romance' }],
}
const WEBTOON_1_ACTION: Webtoon = {
  ...WEBTOON,
  genres: [{ id: 'genre-action', name: 'Action', slug: 'action' }],
}

// Donnees renvoyees par useFetch, modifiables par test (vi.hoisted : la
// fabrique de mockNuxtImport est remontee en tete de fichier).
const fetched = vi.hoisted(() => ({
  catalogue: [] as Webtoon[],
  list: [] as UserWebtoon[],
}))

// useFetch remplace : par defaut le catalogue contient un titre, la liste est vide.
mockNuxtImport('useFetch', () => (url: string) =>
  Promise.resolve({
    data: ref(url.endsWith('/webtoons') ? fetched.catalogue : fetched.list),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  })
)

beforeEach(() => {
  fetched.catalogue = [WEBTOON]
  fetched.list = []
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

type Wrapper = VueWrapper

function searchInput(wrapper: Wrapper) {
  return wrapper.find<HTMLInputElement>('section.filters input[type="search"]')
}

describe('page catalogue : recherche et ?q=', () => {
  it('?q=x pre-remplit le champ de recherche', async () => {
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue?q=solo' })
    expect(searchInput(wrapper).element.value).toBe('solo')
  })

  it('la saisie recopie q dans l URL par replace apres le debounce, sans push', async () => {
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue?vue=liste' })
    const router = useRouter()
    const replace = vi.spyOn(router, 'replace')
    const push = vi.spyOn(router, 'push')
    vi.useFakeTimers()

    await searchInput(wrapper).setValue('tower')
    vi.advanceTimersByTime(299)
    await flushPromises()
    expect(replace).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith({ query: { vue: 'liste', q: 'tower' } })
    expect(push).not.toHaveBeenCalled()
  })

  it('vider le champ retire q et conserve vue', async () => {
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue?q=solo&vue=liste' })
    const router = useRouter()
    const replace = vi.spyOn(router, 'replace')
    const push = vi.spyOn(router, 'push')

    await searchInput(wrapper).setValue('')
    await flushPromises()
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith({ query: { q: undefined, vue: 'liste' } })
    expect(push).not.toHaveBeenCalled()
  })
})

describe('page catalogue : course entre saisie et URL', () => {
  it('un effacement pendant un replace en cours n est pas ecrase', async () => {
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue' })
    const router = useRouter()
    const realReplace = router.replace.bind(router)
    let release: () => void = () => {}
    const replace = vi
      .spyOn(router, 'replace')
      // Premier replace (q=abc) bloque : la navigation n'aboutit pas encore.
      .mockImplementationOnce(() => new Promise((resolve) => {
        release = () => {
          resolve(undefined)
        }
      }))
      .mockImplementation(realReplace)
    vi.useFakeTimers()

    await searchInput(wrapper).setValue('abc')
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(replace).toHaveBeenLastCalledWith({ query: { q: 'abc' } })

    await searchInput(wrapper).setValue('')
    vi.advanceTimersByTime(300)
    await flushPromises()
    release()
    await flushPromises()

    expect(searchInput(wrapper).element.value).toBe('')
    expect(replace).toHaveBeenLastCalledWith({ query: { q: undefined } })
  })

  it('une navigation externe vers ?q=foo remplit le champ sans replace', async () => {
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue' })
    const router = useRouter()
    await router.push('/catalogue?q=foo')
    await flushPromises()
    const replace = vi.spyOn(router, 'replace')
    vi.useFakeTimers()

    expect(searchInput(wrapper).element.value).toBe('foo')
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(replace).not.toHaveBeenCalled()
  })
})

function count(wrapper: Wrapper) {
  return wrapper.get('.toolbar__count').text()
}

function chip(wrapper: Wrapper, group: string, label: string) {
  const button = wrapper
    .findAll(`[role="group"][aria-label="${group}"] button`)
    .find((b) => b.text() === label)
  if (!button) throw new Error(`puce introuvable : ${label}`)
  return button
}

describe('page catalogue : filtres et affichage', () => {
  it('une puce de genre filtre et "Tous" annule le filtre', async () => {
    fetched.catalogue = [WEBTOON_1_ACTION, WEBTOON_2]
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue' })
    expect(count(wrapper)).toBe('2 titres')

    await chip(wrapper, 'Genre', 'Romance').trigger('click')
    expect(chip(wrapper, 'Genre', 'Romance').attributes('aria-pressed')).toBe('true')
    expect(chip(wrapper, 'Genre', 'Tous').attributes('aria-pressed')).toBe('false')
    expect(count(wrapper)).toBe('1 titre')
    expect(wrapper.text()).toContain('True Beauty')
    expect(wrapper.text()).not.toContain('Solo Leveling')

    await chip(wrapper, 'Genre', 'Tous').trigger('click')
    expect(chip(wrapper, 'Genre', 'Tous').attributes('aria-pressed')).toBe('true')
    expect(chip(wrapper, 'Genre', 'Romance').attributes('aria-pressed')).toBe('false')
    expect(count(wrapper)).toBe('2 titres')
  })

  it('la bascule de vue conserve q', async () => {
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue?q=solo' })
    const replace = vi.spyOn(useRouter(), 'replace')

    await chip(wrapper, 'Affichage', 'Liste').trigger('click')
    expect(replace).toHaveBeenCalledWith({ query: { q: 'solo', vue: 'liste' } })
  })

  it('un catalogue vide propose un lien vers /catalogue/new', async () => {
    fetched.catalogue = []
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue' })
    expect(wrapper.text()).toContain('Le catalogue est vide')
    expect(wrapper.find('.empty a[href="/catalogue/new"]').exists()).toBe(true)
  })

  it('un filtre sans resultat propose une reinitialisation qui retablit le compteur', async () => {
    fetched.catalogue = [WEBTOON_1_ACTION, WEBTOON_2]
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue?q=introuvable' })
    expect(count(wrapper)).toBe('0 titre')
    expect(wrapper.text()).toContain('Aucun résultat')
    vi.useFakeTimers()

    const reset = wrapper
      .findAll('.empty button')
      .find((b) => b.text() === 'Réinitialiser les filtres')
    expect(reset).toBeDefined()
    await reset!.trigger('click')
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(searchInput(wrapper).element.value).toBe('')
    expect(count(wrapper)).toBe('2 titres')
  })

  it('la vue liste affiche le statut d un titre suivi, "Pas dans ma liste" sinon', async () => {
    fetched.catalogue = [WEBTOON_1_ACTION, WEBTOON_2]
    fetched.list = [
      {
        id: 'entry-1',
        userId: 'user-1',
        webtoonId: WEBTOON.id,
        status: 'reading',
        chaptersRead: 10,
        rating: null,
        comment: null,
        startedAt: null,
        finishedAt: null,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        webtoon: WEBTOON_1_ACTION,
      },
    ]
    const wrapper = await mountSuspended(CataloguePage, { route: '/catalogue?vue=liste' })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)

    const followed = rows.find((r) => r.text().includes('Solo Leveling'))!
    expect(followed.find('.app-status-chip').text()).toBe('En cours')
    expect(followed.text()).not.toContain('Pas dans ma liste')

    const other = rows.find((r) => r.text().includes('True Beauty'))!
    expect(other.find('.app-status-chip').exists()).toBe(false)
    expect(other.text()).toContain('Pas dans ma liste')
  })
})
