import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Levee quand l'utilisateur tente d'ajouter a sa liste de lecture un
 * webtoon deja present (contrainte UNIQUE(user_id, webtoon_id) en base).
 */
export default class WebtoonAlreadyInListException extends Exception {
  static status = 422
  static code = 'E_WEBTOON_ALREADY_IN_LIST'

  constructor() {
    super('Ce webtoon est deja dans la liste de lecture.', {
      status: WebtoonAlreadyInListException.status,
      code: WebtoonAlreadyInListException.code,
    })
  }

  async handle(error: this, { response }: HttpContext) {
    return response.status(error.status).send({ errors: [{ message: error.message }] })
  }
}
