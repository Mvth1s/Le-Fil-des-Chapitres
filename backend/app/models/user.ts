import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Webtoon from '#models/webtoon'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare username: string

  // Jamais serialise en JSON : evite qu'un hash bcrypt/scrypt ne finisse
  // dans une reponse API par erreur.
  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Genere l'UUID de la ligne avant l'insertion. Phase 1 : un seul
   * utilisateur en base, mais le mecanisme reste valable si l'auth
   * multi-utilisateurs est activee plus tard.
   */
  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  /**
   * Les webtoons de la liste de lecture de cet utilisateur, avec les
   * colonnes de progression accessibles via `$extras` (ex: pivot_status,
   * pivot_chapters_read). Pour manipuler la progression elle-meme
   * (mise a jour, regles metier), preferer des requetes directes sur le
   * modele UserWebtoon plutot que cette relation en lecture seule.
   */
  @manyToMany(() => Webtoon, {
    pivotTable: 'user_webtoons',
    pivotColumns: ['status', 'chapters_read', 'rating', 'comment', 'started_at', 'finished_at'],
    pivotTimestamps: true,
  })
  declare webtoons: ManyToMany<typeof Webtoon>
}
