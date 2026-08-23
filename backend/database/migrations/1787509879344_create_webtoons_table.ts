import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'webtoons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('title', 255).notNullable().unique()
      table.string('author', 255).notNullable()
      table.text('description').nullable()
      table.string('cover_url', 500).nullable()
      // NULL = publication toujours en cours, on ne connait pas le total final.
      table.integer('chapters_total').nullable()
      table.string('link', 500).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
