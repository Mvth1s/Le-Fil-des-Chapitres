import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

/**
 * Only the origins listed in CORS_ORIGINS (comma separated) may call the
 * API from a browser. Empty list = no cross-origin access at all, which is
 * the normal production setup: the browser talks to the Nitro proxy on the
 * frontend domain, and the proxy calls the backend server side.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: (env.get('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: ['Accept', 'Content-Type', 'X-Api-Key'],
  exposeHeaders: [],
  // No cookie or session in phase 1.
  credentials: false,
  maxAge: 90,
})

export default corsConfig
