import { BaseSeeder } from '@adonisjs/lucid/seeders'
import hash from '@adonisjs/core/services/hash'
import User from '#models/user'

/**
 * Phase 1 : un seul utilisateur, cree une fois pour toutes (voir
 * app/services/current_user.ts). Le mot de passe n'est utilise par aucune
 * fonctionnalite tant que l'authentification n'existe pas (Phase 3) ; il
 * est tout de meme hashe pour ne jamais stocker de valeur en clair.
 */
export default class extends BaseSeeder {
  async run() {
    await User.firstOrCreate({ username: 'mathis' }, { password: await hash.make('changeme') })
  }
}
