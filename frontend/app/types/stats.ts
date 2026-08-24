import type { UserWebtoonStatus } from '~/types/user-webtoon'

export interface StatsTopGenre {
  name: string
  slug: string
  count: number
}

// UserWebtoon.load('webtoon') sans preload imbrique de genres (voir
// stats_controller.ts#index) : contrairement a GET /api/user/list, webtoon
// n'a pas de champ "genres" ici. On ne type donc que ce qui est reellement
// present, plutot que de reutiliser le type UserWebtoon complet.
export interface StatsTopRatedEntry {
  id: string
  chaptersRead: number
  rating: number
  webtoon: {
    id: string
    title: string
    author: string
  }
}

export interface Stats {
  totalWebtoons: number
  totalChaptersRead: number
  byStatus: Record<UserWebtoonStatus, number>
  topGenres: StatsTopGenre[]
  topRated: StatsTopRatedEntry[]
}
