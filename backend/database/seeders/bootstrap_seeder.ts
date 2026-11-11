import { BaseSeeder } from '@adonisjs/lucid/seeders'
import hash from '@adonisjs/core/services/hash'
import env from '#start/env'
import User from '#models/user'
import { ensureGenres } from '#database/seeders/genre_seeder'

/**
 * Bootstrap de la production, rejoue a chaque deploiement :
 *   node ace db:seed --files database/seeders/bootstrap_seeder.ts
 * (lance en SSH avec le compte _owner comme connexion par defaut).
 *
 * Idempotent :
 * - l'utilisateur unique n'est cree que si la table "users" est vide ;
 *   un utilisateur existant n'est jamais modifie (mot de passe compris) ;
 * - les 14 genres passent par ensureGenres() (updateOrCreateMany).
 *
 * Limite a la production : ignore par "node ace db:seed" en dev et en
 * test, ou user_seeder.ts cree deja l'utilisateur local.
 */
export default class extends BaseSeeder {
  static environment = ['production']

  async run() {
    const existingUser = await User.query().select('id').first()
    if (!existingUser) {
      const username = env.get('APP_OWNER_USERNAME')
      const password = env.get('APP_OWNER_PASSWORD')
      if (!username || !password) {
        throw new Error(
          'No user in database: APP_OWNER_USERNAME and APP_OWNER_PASSWORD are required to create the owner account'
        )
      }
      // Seul le hash est stocke, le mot de passe en clair n'est jamais logue.
      await User.create({ username, password: await hash.make(password) })
    }

    await ensureGenres()
  }
}
