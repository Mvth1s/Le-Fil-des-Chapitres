import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import UserWebtoon from '#models/user_webtoon'
import Webtoon from '#models/webtoon'
import { getCurrentUser } from '#services/current_user'
import { createUserWebtoonValidator } from '#validators/create_user_webtoon'
import { updateUserWebtoonValidator } from '#validators/update_user_webtoon'
import { updateProgressValidator } from '#validators/update_progress'
import WebtoonAlreadyInListException from '#exceptions/webtoon_already_in_list_exception'
import ChaptersExceedTotalException from '#exceptions/chapters_exceed_total_exception'

export default class UserListController {
  async index({ response }: HttpContext) {
    const user = await getCurrentUser()
    const entries = await UserWebtoon.query()
      .where('userId', user.id)
      .preload('webtoon', (webtoonQuery) => webtoonQuery.preload('genres'))
      .orderBy('updatedAt', 'desc')
    return response.ok(entries)
  }

  async store({ request, response }: HttpContext) {
    const user = await getCurrentUser()
    const payload = await request.validateUsing(createUserWebtoonValidator)

    const webtoon = await Webtoon.findOrFail(payload.webtoonId)

    const alreadyInList = await UserWebtoon.query()
      .where('userId', user.id)
      .where('webtoonId', payload.webtoonId)
      .first()
    if (alreadyInList) {
      throw new WebtoonAlreadyInListException()
    }

    const chaptersRead = payload.chaptersRead ?? 0
    assertChaptersWithinTotal(chaptersRead, webtoon.chaptersTotal)

    const entry = await UserWebtoon.create({
      userId: user.id,
      webtoonId: payload.webtoonId,
      status: payload.status,
      chaptersRead,
      rating: payload.rating ?? null,
      comment: payload.comment ?? null,
      startedAt: payload.startedAt ? DateTime.fromJSDate(payload.startedAt) : null,
      finishedAt: payload.finishedAt ? DateTime.fromJSDate(payload.finishedAt) : null,
    })

    await entry.load('webtoon')
    return response.created(entry)
  }

  async update({ params, request, response }: HttpContext) {
    const entry = await findOwnEntryOrFail(params.id)
    const payload = await request.validateUsing(updateUserWebtoonValidator)

    if (payload.chaptersRead !== undefined) {
      const webtoon = await Webtoon.findOrFail(entry.webtoonId)
      assertChaptersWithinTotal(payload.chaptersRead, webtoon.chaptersTotal)
    }

    // Tous les champs sont optionnels dans le validator : seuls ceux
    // reellement envoyes sont appliques (voir la meme regle dans
    // webtoons_controller.ts#update).
    entry.merge({
      ...(payload.status !== undefined && { status: payload.status }),
      ...(payload.chaptersRead !== undefined && { chaptersRead: payload.chaptersRead }),
      ...(payload.rating !== undefined && { rating: payload.rating }),
      ...(payload.comment !== undefined && { comment: payload.comment }),
      ...(payload.startedAt !== undefined && {
        startedAt: DateTime.fromJSDate(payload.startedAt),
      }),
      ...(payload.finishedAt !== undefined && {
        finishedAt: DateTime.fromJSDate(payload.finishedAt),
      }),
    })
    await entry.save()

    await entry.load('webtoon')
    return response.ok(entry)
  }

  async updateProgress({ params, request, response }: HttpContext) {
    const entry = await findOwnEntryOrFail(params.id)
    const payload = await request.validateUsing(updateProgressValidator)

    const webtoon = await Webtoon.findOrFail(entry.webtoonId)
    assertChaptersWithinTotal(payload.chaptersRead, webtoon.chaptersTotal)

    entry.chaptersRead = payload.chaptersRead
    await entry.save()

    await entry.load('webtoon')
    return response.ok(entry)
  }

  async destroy({ params, response }: HttpContext) {
    const entry = await findOwnEntryOrFail(params.id)
    await entry.delete()
    return response.noContent()
  }
}

/**
 * Phase 1 mono-utilisateur : "own" ne filtre que sur l'utilisateur unique
 * resolu par getCurrentUser(), mais ecrire le filtre des maintenant evite
 * qu'un id d'entree d'un autre utilisateur soit accessible telle quelle
 * en Phase 3 (multi-utilisateurs).
 */
async function findOwnEntryOrFail(id: string) {
  const user = await getCurrentUser()
  return UserWebtoon.query().where('id', id).where('userId', user.id).firstOrFail()
}

function assertChaptersWithinTotal(chaptersRead: number, chaptersTotal: number | null) {
  if (chaptersTotal !== null && chaptersRead > chaptersTotal) {
    throw new ChaptersExceedTotalException(chaptersRead, chaptersTotal)
  }
}
