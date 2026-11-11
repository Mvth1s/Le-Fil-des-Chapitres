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

/*
| Required, non empty secret that is not a leftover placeholder from
| .env.example ("<a-recopier ...>", "<a-generer: ...>").
*/
function secret(key: string, value?: string): string {
  const val = Env.schema.string()(key, value)
  if (val.startsWith('<')) {
    throw new Error(
      `Environment variable "${key}" still holds a placeholder from .env.example, replace it with a real value`
    )
  }
  return val
}

/*
| Secret that is only mandatory in production (API_KEY): validated like the
| other secrets when present, may be absent in development and test.
*/
function productionSecret(minLength: number) {
  return (key: string, value?: string): string | undefined => {
    if (process.env.NODE_ENV !== 'production' && !value) return undefined
    const val = secret(key, value)
    if (val.length < minLength) {
      throw new Error(`Environment variable "${key}" must be at least ${minLength} characters long`)
    }
    return val
  }
}

const env = await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  /*
  | APP_KEY feeds the "legacy" encryption driver (config/encryption.ts),
  | which refuses keys shorter than 16 characters. Validating here makes
  | the app fail at boot with a clear message instead of on first use.
  */
  APP_KEY: (key: string, value?: string): string => {
    const appKey = secret(key, value)
    if (appKey.length < 16) {
      throw new Error(`Environment variable "${key}" must be at least 16 characters long`)
    }
    return appKey
  },
  /*
  | alwaysdata gives the listen address in IP (and/or HOST) without
  | documenting which one: HOST wins, then IP, then every interface.
  | The resolved value is written back to process.env below because the
  | HTTP server (Ignitor) reads process.env.HOST directly, not this service.
  */
  HOST: (key: string, value?: string): string =>
    Env.schema.string({ format: 'host' })(key, value || process.env.IP || '0.0.0.0'),
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
  DB_PASSWORD: secret,
  DB_DATABASE: Env.schema.string(),

  /*
  | Owner account (DDL rights), only used by
  | `node ace migration:run --connection=migration`. Optional because the
  | running site never receives these variables in production.
  */
  DB_MIGRATION_USER: Env.schema.string.optional(),
  DB_MIGRATION_PASSWORD: (key: string, value?: string): string | undefined =>
    Env.schema.string.optional()(key, value) === undefined ? undefined : secret(key, value),

  /*
  | Shared secret sent by the Nitro proxy in the X-Api-Key header
  | (app/middleware/api_key_middleware.ts). Mandatory in production; when
  | set in any environment, /api requires it.
  */
  API_KEY: productionSecret(32),

  /*
  | Comma separated list of browser origins allowed by CORS. Empty in
  | production: the browser only talks to the Nitro proxy (same origin).
  */
  CORS_ORIGINS: Env.schema.string.optional(),

  /*
  | Single user created by database/seeders/bootstrap_seeder.ts on the
  | first deployment. Only passed to that `node ace db:seed` command.
  */
  APP_OWNER_USERNAME: Env.schema.string.optional(),
  APP_OWNER_PASSWORD: (key: string, value?: string): string | undefined =>
    Env.schema.string.optional()(key, value) === undefined ? undefined : secret(key, value),
})

env.set('HOST', env.get('HOST'))

export default env
