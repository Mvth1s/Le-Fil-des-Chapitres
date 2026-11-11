import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import CataloguePage from '~/pages/catalogue/index.vue'
import type { Webtoon } from '~/types/webtoon'

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

// useFetch remplace : le catalogue contient un titre, la liste est vide.
mockNuxtImport('useFetch', () => (url: string) =>
  Promise.resolve({
    data: ref(url.endsWith('/webtoons') ? [WEBTOON] : []),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  })
)

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
