import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'genres'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('name', 100).notNullable().unique()
      table.string('slug', 100).notNullable().unique()

      // Referentiel statique alimente par un seeder : pas besoin de
      // created_at/updated_at, ces lignes ne sont pas amenees a etre suivies
      // dans le temps.
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
