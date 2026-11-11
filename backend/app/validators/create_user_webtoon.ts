import vine from '@vinejs/vine'
import { USER_WEBTOON_STATUSES } from '#models/user_webtoon'
import { ratingSchema } from '#validators/rating_rule'

/**
 * Regles CAHIER_DES_CHARGES.md US-05 : statut obligatoire, chapitres lus
 * par defaut 0. webtoonId doit referencer un webtoon existant (verifie dans
 * le controller, pas ici, pour renvoyer une 404 plutot qu'une 422).
 */
export const createUserWebtoonValidator = vine.compile(
  vine.object({
    webtoonId: vine.string().uuid(),
    status: vine.enum(USER_WEBTOON_STATUSES),
    chaptersRead: vine.number().withoutDecimals().min(0).optional(),
    rating: ratingSchema().optional(),
    comment: vine.string().trim().optional(),
    startedAt: vine.date().optional(),
    finishedAt: vine.date().optional(),
  })
)
