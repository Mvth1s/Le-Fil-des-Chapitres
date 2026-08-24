import type { Webtoon } from '~/types/webtoon'

// Duplique USER_WEBTOON_STATUSES du backend (app/models/user_webtoon.ts) :
// pas de partage de code entre les deux projets Nuxt/AdonisJS distincts.
export const USER_WEBTOON_STATUSES = [
  'reading',
  'completed',
  'on_hold',
  'dropped',
  'plan_to_read',
] as const

export type UserWebtoonStatus = (typeof USER_WEBTOON_STATUSES)[number]

export interface UserWebtoon {
  id: string
  userId: string
  webtoonId: string
  status: UserWebtoonStatus
  chaptersRead: number
  rating: number | null
  comment: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
  webtoon: Webtoon
}
