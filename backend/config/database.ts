import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const migrationUser = env.get('DB_MIGRATION_USER')
const migrationPassword = env.get('DB_MIGRATION_PASSWORD')

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
    |
    | Only declared when both DB_MIGRATION_* variables are set (they are absent
    | from the running site in production, by design). Otherwise
    | "--connection=migration" fails with exit code 1 and Lucid's message
    | '"migration" is not a valid connection name': set those variables.
    */
    ...(migrationUser &&
      migrationPassword && {
        migration: {
          client: 'pg',
          connection: {
            host: env.get('DB_HOST'),
            port: env.get('DB_PORT'),
            user: migrationUser,
            password: migrationPassword,
            database: env.get('DB_DATABASE'),
          },
          migrations: {
            naturalSort: true,
            paths: ['database/migrations'],
          },
        },
      }),
  },
})

export default dbConfig
