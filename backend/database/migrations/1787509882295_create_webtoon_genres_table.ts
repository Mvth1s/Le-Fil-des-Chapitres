import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'webtoon_genres'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('webtoon_id')
        .notNullable()
        .references('id')
        .inTable('webtoons')
        .onDelete('CASCADE')

      table.uuid('genre_id').notNullable().references('id').inTable('genres').onDelete('CASCADE')

      // Table de jonction pure : la cle primaire composite empeche
      // d'associer deux fois le meme genre au meme webtoon.
      table.primary(['webtoon_id', 'genre_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
