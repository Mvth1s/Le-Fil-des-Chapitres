import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Webtoon from '#models/webtoon'

export default class Genre extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare slug: string

  // Pas de created_at/updated_at : table de reference statique (seeder),
  // voir la migration create_genres_table.

  @beforeCreate()
  static assignUuid(genre: Genre) {
    genre.id = randomUUID()
  }

  @manyToMany(() => Webtoon, {
    pivotTable: 'webtoon_genres',
  })
  declare webtoons: ManyToMany<typeof Webtoon>
}
