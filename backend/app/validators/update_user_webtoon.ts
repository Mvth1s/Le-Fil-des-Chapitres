import vine from '@vinejs/vine'
import { USER_WEBTOON_STATUSES } from '#models/user_webtoon'
import { ratingSchema } from '#validators/rating_rule'

/**
 * webtoonId n'est volontairement pas modifiable : pour suivre un autre
 * webtoon, on retire l'entree (DELETE) et on en cree une nouvelle (POST).
 *
 * Champ absent = inchange. rating, comment, startedAt et finishedAt
 * acceptent null pour effacer la valeur (une chaine vide devient null via
 * convertEmptyStringsToNull du bodyparser, donc efface aussi).
 */
export const updateUserWebtoonValidator = vine.compile(
  vine.object({
    status: vine.enum(USER_WEBTOON_STATUSES).optional(),
    chaptersRead: vine.number().withoutDecimals().min(0).optional(),
    rating: ratingSchema().nullable().optional(),
    comment: vine.string().trim().nullable().optional(),
    startedAt: vine.date().nullable().optional(),
    finishedAt: vine.date().nullable().optional(),
  })
)
