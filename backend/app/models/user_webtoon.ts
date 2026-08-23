import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Webtoon from '#models/webtoon'

/**
 * Ligne de progression de lecture d'un utilisateur pour un webtoon donne.
 * Toute donnee de suivi (statut, chapitres lus, note, dates) vit ici et
 * uniquement ici, jamais sur le modele Webtoon.
 */
export default class UserWebtoon extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare webtoonId: string

  // 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read'
  // (contrainte enforcee en base par la migration, pas de type enum
  // TypeScript ici pour rester simple ; a valider via un validator VineJS
  // aux etapes 3/4).
  @column()
  declare status: string

  @column()
  declare chaptersRead: number

  @column()
  declare rating: number | null

  @column()
  declare comment: string | null

  @column.date()
  declare startedAt: DateTime | null

  @column.date()
  declare finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(userWebtoon: UserWebtoon) {
    userWebtoon.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Webtoon)
  declare webtoon: BelongsTo<typeof Webtoon>
}
