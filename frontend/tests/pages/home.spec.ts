import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import HomePage from '~/pages/index.vue'
import type { Stats } from '~/types/stats'
import type { UserWebtoon, UserWebtoonStatus } from '~/types/user-webtoon'
import type { Webtoon } from '~/types/webtoon'

function makeWebtoon(n: number, createdAt = '2026-01-01T00:00:00.000Z'): Webtoon {
  return {
    id: `webtoon-${String(n)}`,
    title: `Titre ${String(n)}`,
    author: 'Auteur',
    description: null,
    coverUrl: null,
    chaptersTotal: 13,
    link: null,
    createdAt,
    updatedAt: createdAt,
    genres: [],
  }
}

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
    webtoon: makeWebtoon(n),
  }
}

function makeStats(entries: UserWebtoon[]): Stats {
  const byStatus = { reading: 0, completed: 0, on_hold: 0, dropped: 0, plan_to_read: 0 }
  for (const entry of entries) byStatus[entry.status] += 1
  return {
    totalWebtoons: entries.length,
    totalChaptersRead: entries.reduce((sum, entry) => sum + entry.chaptersRead, 0),
    byStatus,
    topGenres: [],
    topRated: [],
  }
}

// Donnees servies par le faux useFetch, reinitialisees avant chaque test.
interface FetchState {
  entries: UserWebtoon[]
  webtoons: Webtoon[]
  stats: Stats | null
}
const { state, fetchMock } = vi.hoisted(() => {
  const state: FetchState = { entries: [], webtoons: [], stats: null }
  return { state, fetchMock: vi.fn() }
})

mockNuxtImport('useFetch', () => (url: string) => {
  const data = url.endsWith('/stats')
    ? state.stats
    : url.endsWith('/user/list')
      ? state.entries
      : state.webtoons
  return Promise.resolve({ data: ref(data), pending: ref(false), error: ref(null), refresh: vi.fn() })
})
mockNuxtImport('$fetch', () => fetchMock)

function setData(entries: UserWebtoon[], webtoons: Webtoon[] = []) {
  state.entries = entries
  state.webtoons = webtoons
  state.stats = makeStats(entries)
}

beforeEach(() => {
  setData([])
  fetchMock.mockReset()
})

afterEach(() => {
  document.body.innerHTML = ''
})

const READING = 'section[aria-labelledby="reading-title"]'
const OVERVIEW = 'section[aria-labelledby="overview-title"]'
const RECENT = 'section[aria-labelledby="recent-title"]'

function cardTitles(wrapper: VueWrapper, section: string) {
  return wrapper.findAll(`${section} .wt-card__open`).map((link) => link.text())
}

describe('page accueil', () => {
  it('liste vide : Bienvenue, sans "En cours" ni "Aperçu", avec les récents', async () => {
    const wrapper = await mountSuspended(HomePage)
    expect(wrapper.find('h1').text()).toContain('Bienvenue')
    expect(wrapper.find(READING).exists()).toBe(false)
    expect(wrapper.find(OVERVIEW).exists()).toBe(false)
    expect(wrapper.find(RECENT).text()).toContain('Récemment ajoutés au catalogue')
  })

  it('aucune lecture en cours mais des "À lire" : état vide avec lien vers /liste', async () => {
    setData([makeEntry(1, 'plan_to_read', 0), makeEntry(2, 'plan_to_read', 0)])
    const wrapper = await mountSuspended(HomePage)
    const section = wrapper.find(READING)
    expect(section.text()).toContain('Aucune lecture en cours')
    expect(section.text()).toContain('2 titres à lire')
    expect(section.find('.empty a[href="/liste"]').exists()).toBe(true)
    expect(section.findAll('.wt-card')).toHaveLength(0)
  })

  it('6 lectures en cours : 4 cartes au plus dans "En cours"', async () => {
    setData([1, 2, 3, 4, 5, 6].map((n) => makeEntry(n)))
    const wrapper = await mountSuspended(HomePage)
    expect(cardTitles(wrapper, READING)).toEqual(['Titre 1', 'Titre 2', 'Titre 3', 'Titre 4'])
  })

  it('catalogue de 6 titres : 4 récents au plus, createdAt décroissant', async () => {
    const webtoons = [3, 6, 1, 5, 2, 4].map((n) =>
      makeWebtoon(n, `2026-01-0${String(n)}T00:00:00.000Z`)
    )
    setData([], webtoons)
    const wrapper = await mountSuspended(HomePage)
    expect(cardTitles(wrapper, RECENT)).toEqual(['Titre 6', 'Titre 5', 'Titre 4', 'Titre 3'])
  })

  it('catalogue vide : "Le catalogue est vide"', async () => {
    const wrapper = await mountSuspended(HomePage)
    expect(wrapper.find(RECENT).text()).toContain('Le catalogue est vide')
  })

  it("n'affiche ni prénom ni avatar", async () => {
    setData([makeEntry(1)], [makeWebtoon(1)])
    const wrapper = await mountSuspended(HomePage)
    expect(wrapper.text()).not.toContain('Mvth1s')
    expect(wrapper.find('[class*="avatar"]').exists()).toBe(false)
    // Seul l'heure de la journee precede la ligne de lecture : pas de nom apres le salut.
    expect(wrapper.find('h1').text()).toMatch(/^Bon(jour|soir),\s*tu as 1 webtoon en cours\.$/)
  })

  it('+1 qui termine une entrée : le focus passe sur le lien de la carte suivante', async () => {
    const entries = [makeEntry(1), makeEntry(2, 'reading', 12), makeEntry(3), makeEntry(4), makeEntry(5)]
    setData(entries)
    fetchMock.mockImplementation((url: string) =>
      url.endsWith('/progress')
        ? Promise.resolve({ ...entries[1], chaptersRead: 13, status: 'completed' })
        : Promise.resolve(makeStats(entries))
    )
    const wrapper = await mountSuspended(HomePage, { attachTo: document.body })

    await wrapper.find(`${READING} button[aria-label="+1 chapitre, Titre 2"]`).trigger('click')
    await flushPromises()

    expect(cardTitles(wrapper, READING)).toEqual(['Titre 1', 'Titre 3', 'Titre 4', 'Titre 5'])
    expect(document.activeElement?.textContent.trim()).toBe('Titre 3')
    expect(wrapper.find(`${READING} [aria-live="polite"].sr-only`).text()).toContain(
      'Titre 2 : terminé'
    )
  })
})
