import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import UserWebtoon, { USER_WEBTOON_STATUSES } from '#models/user_webtoon'
import { getCurrentUser } from '#services/current_user'

/**
 * CAHIER_DES_CHARGES.md US-11. Agregations SQL plutot qu'un chargement
 * complet suivi d'un calcul en memoire (voir consignes backend du projet).
 */
export default class StatsController {
  async index({ response }: HttpContext) {
    const user = await getCurrentUser()

    const [totalRow] = await UserWebtoon.query().where('userId', user.id).count('* as total')

    const [chaptersRow] = await UserWebtoon.query()
      .where('userId', user.id)
      .sum('chapters_read as total')

    const statusRows = await UserWebtoon.query()
      .where('userId', user.id)
      .groupBy('status')
      .select('status')
      .count('* as count')

    const byStatus = Object.fromEntries(USER_WEBTOON_STATUSES.map((status) => [status, 0]))
    for (const row of statusRows) {
      byStatus[row.status] = Number(row.$extras.count)
    }

    const topGenres = await db
      .from('user_webtoons')
      .where('user_webtoons.user_id', user.id)
      .join('webtoon_genres', 'webtoon_genres.webtoon_id', 'user_webtoons.webtoon_id')
      .join('genres', 'genres.id', 'webtoon_genres.genre_id')
      .groupBy('genres.id', 'genres.name', 'genres.slug')
      .select('genres.name', 'genres.slug')
      .count('* as count')
      .orderBy('count', 'desc')
      .limit(3)

    const topRated = await UserWebtoon.query()
      .where('userId', user.id)
      .whereNotNull('rating')
      .preload('webtoon')
      .orderBy('rating', 'desc')
      .limit(5)

    return response.ok({
      totalWebtoons: Number(totalRow.$extras.total),
      totalChaptersRead: Number(chaptersRow.$extras.total ?? 0),
      byStatus,
      topGenres: topGenres.map((row) => ({
        name: row.name,
        slug: row.slug,
        count: Number(row.count),
      })),
      topRated,
    })
  }
}
