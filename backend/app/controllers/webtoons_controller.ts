import type { HttpContext } from '@adonisjs/core/http'
import Webtoon from '#models/webtoon'
import Genre from '#models/genre'
import GenreNotFoundException from '#exceptions/genre_not_found_exception'
import { createWebtoonValidator } from '#validators/create_webtoon'
import { updateWebtoonValidator } from '#validators/update_webtoon'

export default class WebtoonsController {
  async index({ response }: HttpContext) {
    const webtoons = await Webtoon.query().preload('genres').orderBy('title', 'asc')
    return response.ok(webtoons)
  }

  async show({ params, response }: HttpContext) {
    const webtoon = await Webtoon.query().where('id', params.id).preload('genres').firstOrFail()
    return response.ok(webtoon)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createWebtoonValidator)
    const { genreIds, ...fields } = payload

    if (genreIds && genreIds.length > 0) {
      await assertGenresExist(genreIds)
    }

    const webtoon = await Webtoon.create({
      title: fields.title,
      author: fields.author,
      description: fields.description ?? null,
      coverUrl: fields.coverUrl ?? null,
      chaptersTotal: fields.chaptersTotal ?? null,
      link: fields.link ?? null,
    })

    if (genreIds && genreIds.length > 0) {
      await webtoon.related('genres').sync(genreIds)
    }

    await webtoon.load('genres')
    return response.created(webtoon)
  }

  async update({ params, request, response }: HttpContext) {
    const webtoon = await Webtoon.findOrFail(params.id)

    const payload = await request.validateUsing(updateWebtoonValidator, {
      meta: { webtoonId: params.id },
    })
    const { genreIds, ...fields } = payload

    if (genreIds && genreIds.length > 0) {
      await assertGenresExist(genreIds)
    }

    webtoon.merge({
      title: fields.title,
      author: fields.author,
      description: fields.description ?? null,
      coverUrl: fields.coverUrl ?? null,
      chaptersTotal: fields.chaptersTotal ?? null,
      link: fields.link ?? null,
    })
    await webtoon.save()

    // genreIds absent du payload : on ne touche pas aux genres existants.
    // genreIds present (meme vide) : on remplace l'association complete.
    if (genreIds !== undefined) {
      await webtoon.related('genres').sync(genreIds)
    }

    await webtoon.load('genres')
    return response.ok(webtoon)
  }

  async destroy({ params, response }: HttpContext) {
    const webtoon = await Webtoon.findOrFail(params.id)
    await webtoon.delete()
    return response.noContent()
  }
}

/**
 * Les FK de webtoon_genres empechent d'associer un genre inexistant, mais
 * l'erreur SQL brute serait une 500 peu comprehensible. On verifie donc en
 * amont pour renvoyer une erreur explicite.
 */
async function assertGenresExist(genreIds: string[]) {
  const found = await Genre.query().whereIn('id', genreIds)
  if (found.length !== genreIds.length) {
    const foundIds = new Set(found.map((genre) => genre.id))
    const missing = genreIds.filter((id) => !foundIds.has(id))
    throw new GenreNotFoundException(missing)
  }
}
