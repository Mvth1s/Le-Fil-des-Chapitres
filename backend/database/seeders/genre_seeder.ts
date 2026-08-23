import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Genre from '#models/genre'
import string from '@adonisjs/core/helpers/string'

/**
 * Les 14 genres predefinis du catalogue (CLAUDE.md section 5).
 * Le slug est derive du nom pour rester coherent (accents et espaces geres
 * par le helper `string.slug` d'AdonisJS).
 */
const GENRE_NAMES = [
  'Action',
  'Romance',
  'Fantasy',
  'Horreur',
  'Comédie',
  'Drame',
  'Thriller',
  'Science-Fiction',
  'Tranche de vie',
  'Isekai',
  'Sports',
  'Mystère',
  'Historique',
  'Surnaturel',
]

export default class extends BaseSeeder {
  async run() {
    const genres = GENRE_NAMES.map((name) => ({
      name,
      slug: string.slug(name, { lower: true }),
    }))

    // updateOrCreateMany : idempotent, evite les doublons si le seeder est
    // relance (base sur l'unicite de "slug").
    await Genre.updateOrCreateMany('slug', genres)
  }
}
