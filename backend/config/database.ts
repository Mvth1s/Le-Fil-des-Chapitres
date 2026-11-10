import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },

    /*
    | Least privilege: the default connection uses the "_app" account, which
    | only has SELECT/INSERT/UPDATE/DELETE (see database/sql/grants.sql). A
    | compromised running backend therefore cannot create, alter or drop
    | tables. Schema changes go through this connection, which uses the
    | "_owner" account and is only selected explicitly:
    |   node ace migration:run --connection=migration
    | After each migration, replay database/sql/grants.sql.
    */
    migration: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_MIGRATION_USER'),
        password: env.get('DB_MIGRATION_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
