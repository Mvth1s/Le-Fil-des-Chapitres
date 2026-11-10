/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  /*
  | APP_KEY feeds the "legacy" encryption driver (config/encryption.ts),
  | which refuses keys shorter than 16 characters. Validating here makes
  | the app fail at boot with a clear message instead of on first use.
  | Env.schema.string has no length option, hence the custom function.
  */
  APP_KEY: (key: string, value?: string): string => {
    const appKey = Env.schema.string()(key, value)
    if (appKey.length < 16) {
      throw new Error(`Environment variable "${key}" must be at least 16 characters long`)
    }
    return appKey
  },
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  // Required and non empty: Env.schema.string rejects an empty value.
  DB_PASSWORD: Env.schema.string(),
  DB_DATABASE: Env.schema.string(),

  /*
  | Owner account (DDL rights), only used by
  | `node ace migration:run --connection=migration`. Optional because the
  | running site never receives these variables in production.
  */
  DB_MIGRATION_USER: Env.schema.string.optional(),
  DB_MIGRATION_PASSWORD: Env.schema.string.optional(),
})
