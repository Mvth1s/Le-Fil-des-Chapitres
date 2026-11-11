import { describe, expect, it } from 'vitest'
import { filterAndSortReadingList, type ReadingListCriteria } from '~/utils/reading-list'
import type { Genre, Webtoon } from '~/types/webtoon'
import type { UserWebtoon } from '~/types/user-webtoon'

const fantasy: Genre = { id: 'g1', name: 'Fantasy', slug: 'fantasy' }
const romance: Genre = { id: 'g2', name: 'Romance', slug: 'romance' }

interface EntryOptions {
  title: string
  author?: string
  genres?: Genre[]
  chaptersTotal?: number | null
  chaptersRead?: number
  rating?: number | null
  status?: UserWebtoon['status']
  createdAt?: string
}

function entry(opts: EntryOptions): UserWebtoon {
  const webtoon: Webtoon = {
    id: `w-${opts.title}`,
    title: opts.title,
    author: opts.author ?? 'Auteur',
    description: null,
    coverUrl: null,
    chaptersTotal: opts.chaptersTotal ?? null,
    link: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    genres: opts.genres ?? [],
  }
  return {
    id: `e-${opts.title}`,
    userId: 'u1',
    webtoonId: webtoon.id,
    status: opts.status ?? 'reading',
    chaptersRead: opts.chaptersRead ?? 0,
    rating: opts.rating ?? null,
    comment: null,
    startedAt: null,
    finishedAt: null,
    createdAt: opts.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    webtoon,
  }
}

function criteria(over: Partial<ReadingListCriteria> = {}): ReadingListCriteria {
  return { search: '', status: '', genreId: '', minRating: null, sort: 'title', ...over }
}

function titles(list: UserWebtoon[]): string[] {
  return list.map((e) => e.webtoon.title)
}

describe('filterAndSortReadingList : recherche', () => {
  const list = [
    entry({ title: 'Été Indien', author: 'Paul' }),
    entry({ title: 'Solo', author: 'Hélène Martin' }),
    entry({ title: 'Autre', author: 'Jean' }),
  ]

  it('cherche dans le titre sans tenir compte de la casse ni des accents', () => {
    expect(titles(filterAndSortReadingList(list, criteria({ search: 'ETE ind' })))).toEqual([
      'Été Indien',
    ])
  })

  it("cherche aussi dans l'auteur", () => {
    expect(titles(filterAndSortReadingList(list, criteria({ search: 'helene' })))).toEqual([
      'Solo',
    ])
  })

  it('une recherche vide renvoie tout', () => {
    expect(filterAndSortReadingList(list, criteria({ search: '' }))).toHaveLength(3)
  })
})

describe('filterAndSortReadingList : filtres', () => {
  const list = [
    entry({ title: 'A', status: 'reading', genres: [fantasy], rating: 8.5 }),
    entry({ title: 'B', status: 'completed', genres: [romance], rating: 8 }),
    entry({ title: 'C', status: 'reading', genres: [fantasy, romance], rating: 7.9 }),
    entry({ title: 'D', status: 'reading', genres: [], rating: null }),
  ]

  it('filtre par statut', () => {
    expect(titles(filterAndSortReadingList(list, criteria({ status: 'completed' })))).toEqual([
      'B',
    ])
  })

  it('filtre par genre', () => {
    expect(titles(filterAndSortReadingList(list, criteria({ genreId: 'g1' })))).toEqual([
      'A',
      'C',
    ])
  })

  it('note minimale : rating >= min, 8.5 passe "8 et plus", les sans note sont exclues', () => {
    expect(titles(filterAndSortReadingList(list, criteria({ minRating: 8 })))).toEqual(['A', 'B'])
  })

  it('note minimale null : toutes les entrees, y compris sans note', () => {
    expect(filterAndSortReadingList(list, criteria({ minRating: null }))).toHaveLength(4)
  })

  it('combine les filtres', () => {
    const result = filterAndSortReadingList(
      list,
      criteria({ status: 'reading', genreId: 'g2', minRating: 7 })
    )
    expect(titles(result)).toEqual(['C'])
  })
})

describe('filterAndSortReadingList : tris', () => {
  it('title et title-desc', () => {
    const list = [entry({ title: 'beta' }), entry({ title: 'Alpha' }), entry({ title: 'Été' })]
    expect(titles(filterAndSortReadingList(list, criteria({ sort: 'title' })))).toEqual([
      'Alpha',
      'beta',
      'Été',
    ])
    expect(titles(filterAndSortReadingList(list, criteria({ sort: 'title-desc' })))).toEqual([
      'Été',
      'beta',
      'Alpha',
    ])
  })

  it('recent et oldest sur createdAt, departage par titre', () => {
    const list = [
      entry({ title: 'Mid', createdAt: '2026-02-01T00:00:00.000Z' }),
      entry({ title: 'Old', createdAt: '2026-01-01T00:00:00.000Z' }),
      entry({ title: 'NewB', createdAt: '2026-03-01T00:00:00.000Z' }),
      entry({ title: 'NewA', createdAt: '2026-03-01T00:00:00.000Z' }),
    ]
    expect(titles(filterAndSortReadingList(list, criteria({ sort: 'recent' })))).toEqual([
      'NewA',
      'NewB',
      'Mid',
      'Old',
    ])
    expect(titles(filterAndSortReadingList(list, criteria({ sort: 'oldest' })))).toEqual([
      'Old',
      'Mid',
      'NewA',
      'NewB',
    ])
  })

  it('rating et rating-asc : sans note en fin dans les deux sens, departage par titre', () => {
    const list = [
      entry({ title: 'NoteNulleB', rating: null }),
      entry({ title: 'Sept', rating: 7 }),
      entry({ title: 'NeufB', rating: 9 }),
      entry({ title: 'NoteNulleA', rating: null }),
      entry({ title: 'NeufA', rating: 9 }),
    ]
    expect(titles(filterAndSortReadingList(list, criteria({ sort: 'rating' })))).toEqual([
      'NeufA',
      'NeufB',
      'Sept',
      'NoteNulleA',
      'NoteNulleB',
    ])
    expect(titles(filterAndSortReadingList(list, criteria({ sort: 'rating-asc' })))).toEqual([
      'Sept',
      'NeufA',
      'NeufB',
      'NoteNulleA',
      'NoteNulleB',
    ])
  })

  it('progress : decroissant, total null ou 0 en fin sans division par zero', () => {
    const list = [
      entry({ title: 'ZeroTotal', chaptersTotal: 0, chaptersRead: 5 }),
      entry({ title: 'Moitie', chaptersTotal: 100, chaptersRead: 50 }),
      entry({ title: 'SansTotal', chaptersTotal: null, chaptersRead: 300 }),
      entry({ title: 'Fini', chaptersTotal: 10, chaptersRead: 10 }),
      entry({ title: 'AussiMoitie', chaptersTotal: 20, chaptersRead: 10 }),
    ]
    expect(titles(filterAndSortReadingList(list, criteria({ sort: 'progress' })))).toEqual([
      'Fini',
      'AussiMoitie',
      'Moitie',
      'SansTotal',
      'ZeroTotal',
    ])
  })
})

describe("filterAndSortReadingList : immuabilite de l'entree", () => {
  it('ne mute pas le tableau recu', () => {
    const list = [entry({ title: 'B' }), entry({ title: 'A' })]
    const snapshot = [...list]
    const result = filterAndSortReadingList(list, criteria({ sort: 'title' }))
    expect(list).toEqual(snapshot)
    expect(titles(list)).toEqual(['B', 'A'])
    expect(result).not.toBe(list)
  })
})
