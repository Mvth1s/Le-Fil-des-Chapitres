import vine from '@vinejs/vine'
import { USER_WEBTOON_STATUSES } from '#models/user_webtoon'

/**
 * webtoonId n'est volontairement pas modifiable : pour suivre un autre
 * webtoon, on retire l'entree (DELETE) et on en cree une nouvelle (POST).
 */
export const updateUserWebtoonValidator = vine.compile(
  vine.object({
    status: vine.enum(USER_WEBTOON_STATUSES).optional(),
    chaptersRead: vine.number().min(0).optional(),
    rating: vine.number().min(0).max(10).optional(),
    comment: vine.string().trim().optional(),
    startedAt: vine.date().optional(),
    finishedAt: vine.date().optional(),
  })
)
