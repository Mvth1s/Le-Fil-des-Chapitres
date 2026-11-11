import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import WebtoonCard from '~/components/WebtoonCard.vue'
import type { Webtoon } from '~/types/webtoon'
import type { UserWebtoon } from '~/types/user-webtoon'

const GENRES = ['Action', 'Romance', 'Drame'].map((name, i) => ({
  id: `genre-${String(i)}`,
  name,
  slug: name.toLowerCase(),
}))

function makeWebtoon(overrides: Partial<Webtoon> = {}): Webtoon {
  return {
    id: 'webtoon-1',
    title: 'Tower of God',
    author: 'SIU',
    description: null,
    coverUrl: null,
    chaptersTotal: 50,
    link: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    genres: GENRES,
    ...overrides,
  }
}

function makeEntry(overrides: Partial<UserWebtoon> = {}, webtoon = makeWebtoon()): UserWebtoon {
  return {
    id: 'entry-1',
    userId: 'user-1',
    webtoonId: webtoon.id,
    status: 'reading',
    chaptersRead: 12,
    rating: null,
    comment: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    webtoon,
    ...overrides,
  }
}

function mountCard(item: Webtoon | UserWebtoon, props: Record<string, unknown> = {}) {
  return mount(WebtoonCard, { props: { item, ...props } })
}

const PLUS = 'button.wt-card__plus'

describe('WebtoonCard', () => {
  it('webtoon du catalogue : ni chip, ni progression, ni +1', () => {
    const wrapper = mountCard(makeWebtoon())
    expect(wrapper.find('.app-status-chip').exists()).toBe(false)
    expect(wrapper.find('.wt-card__progress').exists()).toBe(false)
    expect(wrapper.find(PLUS).exists()).toBe(false)
    expect(wrapper.find('.wt-card__chapters').text()).toBe('50 chapitres')
    expect(wrapper.find('.wt-card__author').text()).toBe('SIU')
  })

  it('entree de liste : chip de statut et "Ch. x / y"', () => {
    const wrapper = mountCard(makeEntry())
    expect(wrapper.find('.app-status-chip').text()).toBe('En cours')
    expect(wrapper.find('.wt-card__chapters').text()).toBe('Ch. 12 / 50')
  })

  it('total inconnu : "Ch. x" et pas de barre de progression', () => {
    const wrapper = mountCard(makeEntry({}, makeWebtoon({ chaptersTotal: null })))
    expect(wrapper.find('.wt-card__chapters').text()).toBe('Ch. 12')
    expect(wrapper.find('.wt-card__progress').exists()).toBe(false)
    // Total inconnu : rien ne borne la progression, le +1 reste propose.
    expect(wrapper.find(PLUS).exists()).toBe(true)
  })

  it('total connu : barre de progression decorative a la bonne largeur', () => {
    const wrapper = mountCard(makeEntry())
    const progress = wrapper.find('.wt-card__progress')
    expect(progress.attributes('aria-hidden')).toBe('true')
    expect(progress.find('.wt-card__progress-bar').attributes('style')).toContain('width: 24%')
  })

  it('affiche au plus 2 genres', () => {
    const tags = mountCard(makeWebtoon()).findAll('.app-genre-tag')
    expect(tags.map((tag) => tag.text())).toEqual(['Action', 'Romance'])
  })

  it('aucun bloc de genres si le webtoon n en a pas', () => {
    const wrapper = mountCard(makeWebtoon({ genres: [] }))
    expect(wrapper.find('.wt-card__genres').exists()).toBe(false)
  })

  it.each(['completed', 'on_hold', 'dropped', 'plan_to_read'] as const)(
    'pas de +1 pour le statut %s',
    (status) => {
      expect(mountCard(makeEntry({ status })).find(PLUS).exists()).toBe(false)
    }
  )

  it('pas de +1 quand le total est atteint', () => {
    expect(mountCard(makeEntry({ chaptersRead: 50 })).find(PLUS).exists()).toBe(false)
  })

  it('le +1 a un nom accessible qui contient le titre', () => {
    const plus = mountCard(makeEntry()).find(PLUS)
    expect(plus.attributes('type')).toBe('button')
    expect(plus.attributes('aria-label')).toContain('Tower of God')
    expect(plus.attributes('aria-disabled')).toBe('false')
  })

  it('le clic sur +1 emet increment sans emettre open', async () => {
    const wrapper = mountCard(makeEntry(), { openMode: 'event' })
    await wrapper.find(PLUS).trigger('click')
    expect(wrapper.emitted('increment')).toHaveLength(1)
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('busy : le +1 reste focusable mais n emet rien', async () => {
    const wrapper = mountCard(makeEntry(), { busy: true })
    const plus = wrapper.find(PLUS)
    expect(plus.attributes('disabled')).toBeUndefined()
    expect(plus.attributes('aria-disabled')).toBe('true')
    await plus.trigger('click')
    expect(wrapper.emitted('increment')).toBeUndefined()
  })

  it('mode event : le titre est un bouton qui emet open', async () => {
    const wrapper = mountCard(makeEntry(), { openMode: 'event' })
    expect(wrapper.find('a').exists()).toBe(false)
    const open = wrapper.find('button.wt-card__open')
    expect(open.text()).toBe('Tower of God')
    await open.trigger('click')
    expect(wrapper.emitted('open')).toHaveLength(1)
  })

  // NuxtLink a besoin du routeur Nuxt : mountSuspended le fournit.
  it('mode link (defaut) : le titre pointe vers la fiche', async () => {
    const wrapper = await mountSuspended(WebtoonCard, { props: { item: makeWebtoon() } })
    const link = wrapper.find('a.wt-card__open')
    expect(link.text()).toBe('Tower of God')
    expect(link.attributes('href')).toBe('/catalogue/webtoon-1')
  })
})
