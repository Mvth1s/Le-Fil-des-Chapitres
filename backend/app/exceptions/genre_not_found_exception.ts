import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Levee quand un webtoon est cree/modifie avec un ou plusieurs genre_ids
 * qui ne correspondent a aucun genre existant. Sans cette exception, la
 * contrainte FK de webtoon_genres remonterait une 500 SQL peu comprehensible.
 */
export default class GenreNotFoundException extends Exception {
  static status = 422
  static code = 'E_GENRE_NOT_FOUND'

  constructor(private missingIds: string[]) {
    super(`Genre(s) introuvable(s) : ${missingIds.join(', ')}`, {
      status: GenreNotFoundException.status,
      code: GenreNotFoundException.code,
    })
  }

  async handle(error: this, { response }: HttpContext) {
    return response.status(error.status).send({
      errors: [{ message: error.message, ids: this.missingIds }],
    })
  }
}
