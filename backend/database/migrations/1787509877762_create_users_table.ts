import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // uuid genere cote application (voir User.beforeCreate), pas de
      // dependance a l'extension Postgres pgcrypto.
      table.uuid('id').primary()

      table.string('username', 50).notNullable().unique()
      table.string('password', 255).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
