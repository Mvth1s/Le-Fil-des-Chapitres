import { randomBytes } from 'node:crypto'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

/**
 * Phase 1 : un seul utilisateur, cree une fois pour toutes (voir
 * app/services/current_user.ts).
 *
 * Le mot de passe n'est utilise par aucune fonctionnalite tant que
 * l'authentification n'existe pas (Phase 3). Plutot qu'une valeur en dur
 * (qui finirait dans le depot), on genere une valeur aleatoire a chaque
 * execution, jamais affichee ni stockee en clair : seul son hash est
 * enregistre. La Phase 3 prevoira un vrai parcours de definition du mot
 * de passe.
 */
export default class extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    const unusedPassword = randomBytes(32).toString('hex')
    await User.firstOrCreate({ username: 'mvth1s' }, { password: await hash.make(unusedPassword) })
  }
}
