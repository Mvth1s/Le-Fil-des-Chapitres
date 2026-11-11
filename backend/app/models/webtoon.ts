import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Genre from '#models/genre'

export default class Webtoon extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare author: string

  @column()
  declare description: string | null

  @column()
  declare coverUrl: string | null

  // NULL = publication en cours, le total de chapitres n'est pas encore connu.
  @column()
  declare chaptersTotal: number | null

  @column()
  declare link: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(webtoon: Webtoon) {
    webtoon.id = randomUUID()
  }

  @manyToMany(() => Genre, {
    pivotTable: 'webtoon_genres',
  })
  declare genres: ManyToMany<typeof Genre>
}
