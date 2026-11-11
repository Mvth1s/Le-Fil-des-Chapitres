import { createHash, timingSafeEqual } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

const sha256 = (value: string) => createHash('sha256').update(value).digest()

/**
 * Protects /api from direct calls: only the Nitro proxy of the frontend
 * knows API_KEY and sends it in X-Api-Key (CLAUDE.md section 4, exception).
 * This is not user authentication. Without API_KEY (development, test) the
 * check is skipped; production refuses to boot without it (start/env.ts).
 *
 * Both values are hashed first so timingSafeEqual always compares 32 bytes:
 * the comparison time leaks neither the content nor the length of the key.
 * The key is never logged.
 */
export default class ApiKeyMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    // Read per request so tests can toggle it with env.set().
    const expected = env.get('API_KEY')
    if (!expected) return next()

    const provided = request.header('x-api-key')
    if (!provided || !timingSafeEqual(sha256(provided), sha256(expected))) {
      return response.unauthorized({ message: 'Unauthorized' })
    }
    return next()
  }
}
