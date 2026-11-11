import type { Webtoon } from '~/types/webtoon'
import type { UserWebtoonStatus } from '~/types/user-webtoon'
import { normalizeSearch } from './search'

export type CatalogueSort = 'title' | 'recent' | 'chapters'

// Valeur speciale du filtre de statut : titres absents de la liste de lecture.
export const NOT_IN_LIST = 'none'

export interface CatalogueCriteria {
  search: string
  genreId: string // '' = tous
  status: UserWebtoonStatus | typeof NOT_IN_LIST | '' // '' = tous
  author: string // '' = tous
  sort: CatalogueSort
}

// Fonction pure (testable sans Nuxt) : filtre puis trie le catalogue.
// statusByWebtoonId : statut de lecture de chaque webtoon present dans la liste.
export function filterAndSortWebtoons(
  webtoons: Webtoon[],
  criteria: CatalogueCriteria,
  statusByWebtoonId: Map<string, UserWebtoonStatus>
): Webtoon[] {
  const query = normalizeSearch(criteria.search)

  const filtered = webtoons.filter((webtoon) => {
    if (
      query &&
      !normalizeSearch(webtoon.title).includes(query) &&
      !normalizeSearch(webtoon.author).includes(query)
    ) {
      return false
    }
    if (criteria.genreId && !webtoon.genres.some((genre) => genre.id === criteria.genreId)) {
      return false
    }
    if (criteria.author && webtoon.author !== criteria.author) {
      return false
    }
    if (criteria.status) {
      const status = statusByWebtoonId.get(webtoon.id)
      if (criteria.status === NOT_IN_LIST ? status !== undefined : status !== criteria.status) {
        return false
      }
    }
    return true
  })

  // slice() : sort() trie en place, on ne modifie pas le tableau d'entree.
  return filtered.slice().sort((a, b) => {
    if (criteria.sort === 'recent') {
      return b.createdAt.localeCompare(a.createdAt)
    }
    if (criteria.sort === 'chapters') {
      // null en fin de liste, puis ordre decroissant (les plus longs d'abord).
      if (a.chaptersTotal === null) return b.chaptersTotal === null ? 0 : 1
      if (b.chaptersTotal === null) return -1
      return b.chaptersTotal - a.chaptersTotal
    }
    return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' })
  })
}
