import type { UserWebtoon, UserWebtoonStatus } from '~/types/user-webtoon'
import { normalizeSearch } from './search'

export type ReadingListSort =
  | 'title'
  | 'title-desc'
  | 'recent'
  | 'oldest'
  | 'rating'
  | 'rating-asc'
  | 'progress'

export interface ReadingListCriteria {
  search: string
  status: UserWebtoonStatus | '' // '' = tous
  genreId: string // '' = tous
  minRating: number | null // null = toutes ; sinon les entrees sans note sont exclues
  sort: ReadingListSort
}

// Progression en fraction (0 a 1), null si le total est inconnu (null ou 0).
function progressOf(entry: UserWebtoon): number | null {
  const total = entry.webtoon.chaptersTotal
  return total ? entry.chaptersRead / total : null
}

// Compare deux valeurs numeriques (decroissant par defaut), null toujours en fin de liste.
function compareNullsLast(a: number | null, b: number | null, ascending = false): number {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1
  return ascending ? a - b : b - a
}

// Fonction pure (testable sans Nuxt) : filtre puis trie la liste de lecture.
export function filterAndSortReadingList(
  entries: UserWebtoon[],
  criteria: ReadingListCriteria
): UserWebtoon[] {
  const query = normalizeSearch(criteria.search)
  const { minRating } = criteria

  const filtered = entries.filter((entry) => {
    if (
      query &&
      !normalizeSearch(entry.webtoon.title).includes(query) &&
      !normalizeSearch(entry.webtoon.author).includes(query)
    ) {
      return false
    }
    if (criteria.status && entry.status !== criteria.status) return false
    if (criteria.genreId && !entry.webtoon.genres.some((genre) => genre.id === criteria.genreId)) {
      return false
    }
    if (minRating !== null && (entry.rating === null || entry.rating < minRating)) return false
    return true
  })

  const byTitle = (a: UserWebtoon, b: UserWebtoon) =>
    a.webtoon.title.localeCompare(b.webtoon.title, 'fr', { sensitivity: 'base' })

  // slice() : sort() trie en place. Egalite sur le critere principal : departage par titre A-Z.
  return filtered.slice().sort((a, b) => {
    switch (criteria.sort) {
      case 'title-desc':
        return byTitle(b, a)
      case 'recent':
        return b.createdAt.localeCompare(a.createdAt) || byTitle(a, b)
      case 'oldest':
        return a.createdAt.localeCompare(b.createdAt) || byTitle(a, b)
      case 'rating':
        return compareNullsLast(a.rating, b.rating) || byTitle(a, b)
      case 'rating-asc':
        return compareNullsLast(a.rating, b.rating, true) || byTitle(a, b)
      case 'progress':
        return compareNullsLast(progressOf(a), progressOf(b)) || byTitle(a, b)
      default:
        return byTitle(a, b)
    }
  })
}
