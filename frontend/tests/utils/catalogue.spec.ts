import { describe, expect, it } from 'vitest'
import { filterAndSortWebtoons, type CatalogueCriteria } from '~/utils/catalogue'
import type { Webtoon } from '~/types/webtoon'
import type { UserWebtoonStatus } from '~/types/user-webtoon'

const fantasy = { id: 'g1', name: 'Fantasy', slug: 'fantasy' }
const romance = { id: 'g2', name: 'Romance', slug: 'romance' }

function webtoon(over: Partial<Webtoon> & Pick<Webtoon, 'id' | 'title'>): Webtoon {
  return {
    author: 'Auteur',
    description: null,
    coverUrl: null,
    chaptersTotal: null,
    link: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    genres: [],
    ...over,
  }
}

const a = webtoon({
  id: 'a',
  title: 'Zebre',
  author: 'Hélène Martin',
  chaptersTotal: 50,
  createdAt: '2026-03-01T00:00:00.000Z',
  genres: [fantasy],
})
const b = webtoon({
  id: 'b',
  title: "L'Élève",
  author: 'Paul',
  chaptersTotal: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  genres: [romance],
})
const c = webtoon({
  id: 'c',
  title: 'Ecole',
  author: 'Paul',
  chaptersTotal: 200,
  createdAt: '2026-02-01T00:00:00.000Z',
  genres: [fantasy, romance],
})
const all = [a, b, c]

const base: CatalogueCriteria = { search: '', genreId: '', status: '', author: '', sort: 'title' }
const statuses = new Map<string, UserWebtoonStatus>([
  ['a', 'reading'],
  ['c', 'completed'],
])

function run(criteria: Partial<CatalogueCriteria>, list = all) {
  return filterAndSortWebtoons(list, { ...base, ...criteria }, statuses).map((w) => w.id)
}

describe('filterAndSortWebtoons', () => {
  it('renvoie tout quand les criteres sont vides', () => {
    expect(run({}).sort()).toEqual(['a', 'b', 'c'])
  })

  it('recherche dans le titre sans tenir compte de la casse ni des accents', () => {
    expect(run({ search: 'ELEVE' })).toEqual(['b'])
    expect(run({ search: 'école' })).toEqual(['c'])
  })

  it('recherche aussi dans l auteur', () => {
    expect(run({ search: 'helene' })).toEqual(['a'])
  })

  it('filtre par genre', () => {
    expect(run({ genreId: 'g2' })).toEqual(['c', 'b'])
  })

  it('filtre par statut de lecture', () => {
    expect(run({ status: 'reading' })).toEqual(['a'])
  })

  it("filtre 'none' : titres absents de la liste", () => {
    expect(run({ status: 'none' })).toEqual(['b'])
  })

  it('filtre par auteur exact', () => {
    expect(run({ author: 'Paul' })).toEqual(['c', 'b'])
    expect(run({ author: 'Pau' })).toEqual([])
  })

  it('combine les filtres', () => {
    expect(run({ author: 'Paul', genreId: 'g1' })).toEqual(['c'])
    expect(run({ author: 'Paul', genreId: 'g2', status: 'none', search: 'eleve' })).toEqual(['b'])
    expect(run({ author: 'Paul', status: 'reading' })).toEqual([])
  })

  it('trie par titre en francais en ignorant les accents', () => {
    const e1 = webtoon({ id: 'e1', title: 'Été' })
    const e2 = webtoon({ id: 'e2', title: 'Etoile' })
    const f = webtoon({ id: 'f', title: 'Fleur' })
    const d = webtoon({ id: 'd', title: 'Dune' })
    expect(run({ sort: 'title' }, [f, e2, d, e1])).toEqual(['d', 'e1', 'e2', 'f'])
  })

  it('trie par date de creation decroissante', () => {
    expect(run({ sort: 'recent' })).toEqual(['a', 'c', 'b'])
  })

  it('trie par nombre de chapitres decroissant, null en fin', () => {
    const n = webtoon({ id: 'n', title: 'N', chaptersTotal: null })
    expect(run({ sort: 'chapters' }, [b, a, n, c])).toEqual(['c', 'a', 'b', 'n'])
  })

  it('departage par titre les egalites du tri recent', () => {
    const date = '2026-05-01T00:00:00.000Z'
    const z = webtoon({ id: 'z', title: 'Zinnia', createdAt: date })
    const e = webtoon({ id: 'e', title: 'Écho', createdAt: date })
    const f = webtoon({ id: 'f', title: 'Fable', createdAt: date })
    expect(run({ sort: 'recent' }, [z, f, e])).toEqual(['e', 'f', 'z'])
  })

  it('departage par titre les egalites du tri chapters, y compris entre null', () => {
    const z = webtoon({ id: 'z', title: 'Zinnia', chaptersTotal: 10 })
    const e = webtoon({ id: 'e', title: 'Écho', chaptersTotal: 10 })
    const zn = webtoon({ id: 'zn', title: 'Zeste', chaptersTotal: null })
    const en = webtoon({ id: 'en', title: 'Étoile', chaptersTotal: null })
    expect(run({ sort: 'chapters' }, [zn, z, en, e])).toEqual(['e', 'z', 'en', 'zn'])
  })

  it('ne modifie pas le tableau d entree', () => {
    const input = [a, b, c]
    run({ sort: 'recent', genreId: 'g1' }, input)
    expect(input).toEqual([a, b, c])
  })
})
