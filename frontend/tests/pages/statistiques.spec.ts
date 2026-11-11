import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import StatsPage from '~/pages/statistiques/index.vue'
import type { Stats } from '~/types/stats'

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    totalWebtoons: 4,
    totalChaptersRead: 120,
    byStatus: { reading: 2, completed: 1, on_hold: 1, dropped: 0, plan_to_read: 0 },
    topGenres: [],
    topRated: [],
    ...overrides,
  }
}

// Donnees servies par le faux useFetch, reinitialisees avant chaque test.
interface FetchState {
  stats: Stats | null
  error: Error | null
}
const { state, refreshMock } = vi.hoisted(() => {
  const state: FetchState = { stats: null, error: null }
  return { state, refreshMock: vi.fn() }
})

mockNuxtImport('useFetch', () => () =>
  Promise.resolve({
    data: ref(state.stats),
    pending: ref(false),
    error: ref(state.error),
    refresh: refreshMock,
  })
)

beforeEach(() => {
  state.stats = makeStats()
  state.error = null
  refreshMock.mockReset()
})

afterEach(() => {
  document.body.innerHTML = ''
})

const normalizeSpaces = (text: string) => text.replace(/\s+/gu, ' ').trim()
const STATUS = 'section[aria-labelledby="status-title"]'
const GENRES = 'section[aria-labelledby="genres-title"]'
const RATED = 'section[aria-labelledby="rated-title"]'

describe('page statistiques', () => {
  it('titre H1 "Statistiques"', async () => {
    const wrapper = await mountSuspended(StatsPage)
    expect(wrapper.find('h1').text()).toBe('Statistiques')
  })

  it('erreur : "Réessayer" appelle refresh', async () => {
    state.stats = null
    state.error = new Error('boom')
    const wrapper = await mountSuspended(StatsPage)
    expect(wrapper.text()).toContain('Impossible de charger les statistiques')
    const retry = wrapper.findAll('button').find((button) => button.text() === 'Réessayer')
    expect(retry).toBeDefined()
    await retry!.trigger('click')
    expect(refreshMock).toHaveBeenCalledTimes(1)
  })

  it('liste vide : lien vers /catalogue, sans graphiques', async () => {
    state.stats = makeStats({
      totalWebtoons: 0,
      totalChaptersRead: 0,
      byStatus: { reading: 0, completed: 0, on_hold: 0, dropped: 0, plan_to_read: 0 },
    })
    const wrapper = await mountSuspended(StatsPage)
    expect(wrapper.text()).toContain('Pas encore de statistiques')
    expect(wrapper.find('a[href="/catalogue"]').exists()).toBe(true)
    expect(wrapper.find(STATUS).exists()).toBe(false)
  })

  it('4 chiffres clés dans l ordre', async () => {
    const wrapper = await mountSuspended(StatsPage)
    expect(wrapper.findAll('dt').map((dt) => dt.text())).toEqual([
      'Titres suivis',
      'Chapitres lus',
      'Terminés',
      'En cours',
    ])
    expect(wrapper.findAll('dd').map((dd) => dd.text())).toEqual(['4', '120', '1', '2'])
  })

  it('5 barres de statut : texte, piste décorative et largeur', async () => {
    const wrapper = await mountSuspended(StatsPage)
    const items = wrapper.findAll(`${STATUS} li`)
    expect(items).toHaveLength(5)
    expect(items.map((li) => normalizeSpaces(li.find('.bar__value').text()))).toEqual([
      '2 titres, 50 %',
      '1 titre, 25 %',
      '1 titre, 25 %',
      '0 titre, 0 %',
      '0 titre, 0 %',
    ])
    expect(items.map((li) => li.find('.bar__label').text())).toEqual([
      'En cours',
      'Terminé',
      'En pause',
      'Abandonné',
      'À lire',
    ])
    for (const li of items) {
      expect(li.find('.bar__track').attributes('aria-hidden')).toBe('true')
    }
    expect(
      items.map((li) => (li.find('.bar__fill').element as HTMLElement).style.width)
    ).toEqual(['50%', '25%', '25%', '0%', '0%'])
  })

  it('sans genre ni note : messages dédiés', async () => {
    const wrapper = await mountSuspended(StatsPage)
    expect(wrapper.find(`${GENRES} ul`).exists()).toBe(false)
    expect(wrapper.find(GENRES).text()).toContain('Aucun genre pour l\'instant')
    expect(wrapper.find(`${RATED} ol`).exists()).toBe(false)
    expect(wrapper.find(RATED).text()).toContain('Aucune note pour l\'instant')
  })

  it('genres : largeur relative au plus lu', async () => {
    state.stats = makeStats({
      topGenres: [
        { name: 'Action', slug: 'action', count: 4 },
        { name: 'Romance', slug: 'romance', count: 1 },
      ],
    })
    const wrapper = await mountSuspended(StatsPage)
    const items = wrapper.findAll(`${GENRES} li`)
    expect(items.map((li) => li.find('.bar__label').text())).toEqual(['Action', 'Romance'])
    expect(
      items.map((li) => (li.find('.bar__fill').element as HTMLElement).style.width)
    ).toEqual(['100%', '25%'])
  })

  it('top noté : liste ordonnée, lien vers la fiche, note sur 10', async () => {
    state.stats = makeStats({
      topRated: [
        {
          id: 'entry-1',
          chaptersRead: 10,
          rating: 8.5,
          webtoon: { id: 'webtoon-1', title: 'Titre 1', author: 'Auteur', coverUrl: null },
        },
      ],
    })
    const wrapper = await mountSuspended(StatsPage)
    const items = wrapper.findAll(`${RATED} ol > li`)
    expect(items).toHaveLength(1)
    const link = items[0]!.find('a[href="/catalogue/webtoon-1"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Titre 1')
    const rating = normalizeSpaces(items[0]!.find('.rated__rating').text())
    expect(rating).toContain('8,5')
    expect(rating).toContain('/ 10')
  })
})
