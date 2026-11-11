import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useChapterIncrement } from '~/composables/useChapterIncrement'
import { useToast } from '~/composables/useToast'
import type { UserWebtoon } from '~/types/user-webtoon'

function makeEntry(id: string, chaptersRead = 12): UserWebtoon {
  return {
    id,
    userId: 'user-1',
    webtoonId: `webtoon-${id}`,
    status: 'reading',
    chaptersRead,
    rating: null,
    comment: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    webtoon: {
      id: `webtoon-${id}`,
      title: 'Titre',
      author: 'Auteur',
      description: null,
      coverUrl: null,
      chaptersTotal: 13,
      link: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
    },
  }
}

// $fetch est un auto-import Nuxt (pas un global) : on remplace l'import,
// aucune requete reseau n'est emise.
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
mockNuxtImport('$fetch', () => fetchMock)

beforeEach(() => {
  fetchMock.mockReset()
  useToast().toasts.value = []
})

afterEach(() => {
  const { toasts, dismiss } = useToast()
  for (const toast of toasts.value) dismiss(toast.id)
})

describe('useChapterIncrement', () => {
  it('envoie chaptersRead + 1 et remplace l entree en gardant son webtoon', async () => {
    const a = makeEntry('a')
    const b = makeEntry('b')
    const entries = ref<UserWebtoon[] | undefined>([a, b])
    // La reponse PATCH ne precharge pas les genres.
    const updated = { ...a, chaptersRead: 13, status: 'completed' as const, webtoon: { ...a.webtoon, genres: [] } }
    fetchMock.mockResolvedValue(updated)

    const { increment, pendingIds } = useChapterIncrement(entries)
    const result = await increment(a)

    expect(fetchMock).toHaveBeenCalledWith('/api/user/list/a/progress', {
      method: 'PATCH',
      body: { chaptersRead: 13 },
    })
    expect(result).toEqual(updated)
    expect(entries.value?.[0]).toMatchObject({ chaptersRead: 13, status: 'completed' })
    expect(entries.value?.[0]?.webtoon.genres).toHaveLength(1)
    expect(entries.value?.[1]).toEqual(b)
    expect(pendingIds.size).toBe(0)
  })

  it('ignore un second clic tant que la requete est en cours', async () => {
    const a = makeEntry('a')
    let resolve: (value: UserWebtoon) => void = () => {}
    fetchMock.mockReturnValue(new Promise<UserWebtoon>((r) => (resolve = r)))

    const { increment, pendingIds } = useChapterIncrement(ref([a]))
    const first = increment(a)
    expect(pendingIds.has('a')).toBe(true)
    expect(await increment(a)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    resolve({ ...a, chaptersRead: 13 })
    await first
    expect(pendingIds.has('a')).toBe(false)
  })

  it('en echec : toast du message metier, liste inchangee, renvoie null', async () => {
    const a = makeEntry('a')
    const entries = ref<UserWebtoon[] | undefined>([a])
    fetchMock.mockRejectedValue({
      statusCode: 422,
      data: { errors: [{ message: 'Trop de chapitres' }] },
    })

    const { increment, pendingIds } = useChapterIncrement(entries)
    expect(await increment(a)).toBeNull()
    expect(entries.value).toEqual([a])
    expect(pendingIds.size).toBe(0)
    expect(useToast().toasts.value).toMatchObject([{ type: 'error', message: 'Trop de chapitres' }])
  })

  it('en echec reseau : toast de repli generique', async () => {
    const a = makeEntry('a')
    fetchMock.mockRejectedValue(new Error('network'))

    const { increment } = useChapterIncrement(ref([a]))
    await increment(a)
    expect(useToast().toasts.value[0]?.message).toContain('a échoué')
  })
})
