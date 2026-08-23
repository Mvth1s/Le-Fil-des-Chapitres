import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Regle metier CLAUDE.md section 5 : chapters_read ne doit jamais depasser
 * chapters_total quand ce dernier est defini.
 */
export default class ChaptersExceedTotalException extends Exception {
  static status = 422
  static code = 'E_CHAPTERS_EXCEED_TOTAL'

  constructor(chaptersRead: number, chaptersTotal: number) {
    super(
      `chapters_read (${chaptersRead}) ne peut pas depasser chapters_total (${chaptersTotal}).`,
      { status: ChaptersExceedTotalException.status, code: ChaptersExceedTotalException.code }
    )
  }

  async handle(error: this, { response }: HttpContext) {
    return response.status(error.status).send({ errors: [{ message: error.message }] })
  }
}
