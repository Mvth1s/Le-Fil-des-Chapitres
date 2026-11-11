import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import DetailPage from '~/pages/catalogue/[id]/index.vue'
import type { Webtoon } from '~/types/webtoon'
import type { UserWebtoon, UserWebtoonStatus } from '~/types/user-webtoon'

const WEBTOON: Webtoon = {
  id: 'webtoon-1',
  title: 'Solo Leveling',
  author: 'Chugong',
  description: null,
  coverUrl: null,
  chaptersTotal: 10,
  link: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  genres: [],
}

function makeEntry(status: UserWebtoonStatus, chaptersRead: number, rating: number | null = null): UserWebtoon {
  return {
    id: 'entry-1',
    userId: 'user-1',
    webtoonId: WEBTOON.id,
    status,
    chaptersRead,
    rating,
    comment: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    webtoon: WEBTOON,
  }
}

// Donnees servies par le faux useFetch et faux $fetch (vi.hoisted : la
// fabrique de mockNuxtImport est remontee en tete de fichier).
const { state, fetchMock } = vi.hoisted(() => ({
  state: {
    webtoon: null as Webtoon | null,
    webtoonError: null as { statusCode: number } | null,
    list: [] as UserWebtoon[],
  },
  fetchMock: vi.fn(),
}))

mockNuxtImport('useFetch', () => (url: string) =>
  Promise.resolve(
    url.endsWith('/user/list')
      ? { data: ref(state.list), pending: ref(false), error: ref(null), refresh: vi.fn() }
      : {
          data: ref(state.webtoonError ? null : state.webtoon),
          pending: ref(false),
          error: ref(state.webtoonError),
          refresh: vi.fn(),
        }
  )
)
mockNuxtImport('$fetch', () => fetchMock)

beforeEach(() => {
  state.webtoon = WEBTOON
  state.webtoonError = null
  state.list = []
  fetchMock.mockReset()
})

afterEach(() => {
  document.body.innerHTML = ''
})

function mountPage() {
  return mountSuspended(DetailPage, { route: '/catalogue/webtoon-1', attachTo: document.body })
}

function plusButton(wrapper: VueWrapper) {
  return wrapper.find('button.my-list__plus')
}

function listLink(wrapper: VueWrapper) {
  return wrapper.get('a[href="/liste"]')
}

describe('page detail : bouton +1 chapitre', () => {
  it('visible si reading et chaptersRead < total', async () => {
    state.list = [makeEntry('reading', 5)]
    const wrapper = await mountPage()
    expect(plusButton(wrapper).text()).toBe('+1 chapitre')
  })

  it.each([
    ['reading au total', makeEntry('reading', 10)],
    ['completed', makeEntry('completed', 5)],
    ['on_hold', makeEntry('on_hold', 5)],
    ['plan_to_read', makeEntry('plan_to_read', 0)],
  ])('absent : %s', async (_label, entry) => {
    state.list = [entry]
    const wrapper = await mountPage()
    expect(plusButton(wrapper).exists()).toBe(false)
  })

  it('clic : PATCH /api/user/list/:id/progress avec chaptersRead + 1', async () => {
    state.list = [makeEntry('reading', 5)]
    fetchMock.mockResolvedValue(makeEntry('reading', 6))
    const wrapper = await mountPage()
    await plusButton(wrapper).trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/user/list/entry-1/progress', {
      method: 'PATCH',
      body: { chaptersRead: 6 },
    })
    expect(wrapper.get('.my-list__chapters').text()).toBe('Ch. 6 / 10')
  })

  it('passage a completed : le bouton disparait, focus sur le lien vers la liste', async () => {
    state.list = [makeEntry('reading', 9)]
    fetchMock.mockResolvedValue(makeEntry('completed', 10))
    const wrapper = await mountPage()
    await plusButton(wrapper).trigger('click')
    await flushPromises()

    expect(plusButton(wrapper).exists()).toBe(false)
    expect(document.activeElement).toBe(listLink(wrapper).element)
  })
})

describe('page detail : note', () => {
  it('affiche la note sur 10', async () => {
    state.list = [makeEntry('reading', 5, 8)]
    const wrapper = await mountPage()
    expect(wrapper.get('.my-list__rating').text()).toBe('Ma note : 8 / 10')
  })

  it('sans note : "Pas encore de note."', async () => {
    state.list = [makeEntry('reading', 5)]
    const wrapper = await mountPage()
    expect(wrapper.get('.my-list__rating').text()).toBe('Pas encore de note.')
  })
})

describe('page detail : etats d erreur', () => {
  it('404 : message dedie, sans bouton Reessayer', async () => {
    state.webtoonError = { statusCode: 404 }
    const wrapper = await mountPage()
    expect(wrapper.get('.error-box').text()).toBe("Ce webtoon n'existe pas.")
    expect(wrapper.find('article.detail').exists()).toBe(false)
  })

  it('autre erreur : message generique et bouton Reessayer', async () => {
    state.webtoonError = { statusCode: 500 }
    const wrapper = await mountPage()
    const box = wrapper.get('.error-box')
    expect(box.text()).toContain('Impossible de charger cette fiche pour le moment.')
    expect(box.get('button').text()).toBe('Réessayer')
  })
})
