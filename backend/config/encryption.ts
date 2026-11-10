import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/core/encryption'

/**
 * Encryption configuration (replaces the "appKey" export of config/app.ts
 * since AdonisJS 7).
 *
 * The "legacy" driver keeps the AdonisJS 6 format (AES-256-CBC + HMAC), so
 * anything encrypted before the upgrade stays readable. Losing or changing
 * APP_KEY makes previously encrypted data undecryptable.
 */
const encryptionConfig = defineConfig({
  default: 'legacy',
  list: {
    legacy: drivers.legacy({
      keys: [env.get('APP_KEY')],
    }),
  },
})

export default encryptionConfig
