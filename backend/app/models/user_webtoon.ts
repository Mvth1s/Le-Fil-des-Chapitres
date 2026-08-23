import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, beforeSave, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Webtoon from '#models/webtoon'

export const USER_WEBTOON_STATUSES = [
  'reading',
  'completed',
  'on_hold',
  'dropped',
  'plan_to_read',
] as const

export type UserWebtoonStatus = (typeof USER_WEBTOON_STATUSES)[number]

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

  // Contrainte CHECK enforcee en base par la migration (voir
  // USER_WEBTOON_STATUSES ci-dessus pour la liste des valeurs valides,
  // reutilisee par les validators VineJS).
  @column()
  declare status: UserWebtoonStatus

  @column()
  declare chaptersRead: number

  // Le driver pg renvoie les DECIMAL sous forme de string (evite les pertes
  // de precision flottante) : on reconvertit en number pour que l'API
  // renvoie un vrai nombre JSON plutot que "9.5".
  @column({
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
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

  /**
   * Regles metier CLAUDE.md section 5, centralisees ici plutot que dupliquees
   * dans chaque controller qui modifie une entree (store/update/progress) :
   * - le statut passe automatiquement a "completed" quand chapters_read
   *   atteint chapters_total (si ce dernier est defini) ;
   * - started_at/finished_at se renseignent automatiquement au passage dans
   *   le statut correspondant, si pas deja fournis explicitement.
   */
  @beforeSave()
  static async applyProgressRules(userWebtoon: UserWebtoon) {
    if (userWebtoon.$dirty.chaptersRead !== undefined) {
      const webtoon = await Webtoon.find(userWebtoon.webtoonId)
      if (
        webtoon &&
        webtoon.chaptersTotal !== null &&
        userWebtoon.chaptersRead >= webtoon.chaptersTotal
      ) {
        userWebtoon.status = 'completed'
      }
    }

    if (userWebtoon.$dirty.status === 'reading' && !userWebtoon.startedAt) {
      userWebtoon.startedAt = DateTime.now()
    }
    if (userWebtoon.status === 'completed' && !userWebtoon.finishedAt) {
      userWebtoon.finishedAt = DateTime.now()
    }
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Webtoon)
  declare webtoon: BelongsTo<typeof Webtoon>
}
