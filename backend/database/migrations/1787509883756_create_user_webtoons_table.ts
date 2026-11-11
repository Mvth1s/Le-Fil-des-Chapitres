import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_webtoons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      table
        .uuid('webtoon_id')
        .notNullable()
        .references('id')
        .inTable('webtoons')
        .onDelete('CASCADE')

      // Pas d'enum Postgres natif (comportement par defaut de knex sans
      // options) : un varchar + check garde la contrainte lisible et facile
      // a faire evoluer sans migration ALTER TYPE.
      table
        .enum('status', ['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'])
        .notNullable()

      table.integer('chapters_read').notNullable().defaultTo(0)
      table.decimal('rating', 3, 1).nullable()
      table.text('comment').nullable()
      table.date('started_at').nullable()
      table.date('finished_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Un utilisateur ne peut avoir qu'une seule entree de progression
      // par webtoon.
      table.unique(['user_id', 'webtoon_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
