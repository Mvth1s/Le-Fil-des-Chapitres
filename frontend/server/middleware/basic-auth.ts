import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * HTTP Basic Auth devant tout le frontend (pages, /api, assets servis par
 * Nitro). Protection de l'instance publique, pas une authentification
 * utilisateur (CLAUDE.md section 4, exception). Desactivee quand les deux
 * identifiants sont vides (dev local) ; en production le plugin
 * server/plugins/check-env.ts refuse de demarrer sans eux.
 */

// Hacher avant de comparer donne deux buffers de meme longueur (exige par
// timingSafeEqual) et ne revele pas la longueur attendue.
function sameSecret(provided: string, expected: string) {
  const sha = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(sha(provided), sha(expected))
}

export default defineEventHandler((event) => {
  const { basicAuthUser, basicAuthPassword } = useRuntimeConfig(event)
  if (!basicAuthUser && !basicAuthPassword) return

  const header = getRequestHeader(event, 'authorization') ?? ''
  const decoded = header.startsWith('Basic ')
    ? Buffer.from(header.slice(6), 'base64').toString('utf8')
    : ''
  const separator = decoded.indexOf(':')
  const user = separator === -1 ? '' : decoded.slice(0, separator)
  const password = separator === -1 ? '' : decoded.slice(separator + 1)

  // Les deux comparaisons sont toujours executees (pas de court-circuit &&).
  const userOk = sameSecret(user, basicAuthUser)
  const passwordOk = sameSecret(password, basicAuthPassword)
  if (separator !== -1 && userOk && passwordOk) return

  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="Le Fil des Chapitres", charset="UTF-8"')
  setResponseStatus(event, 401)
  return 'Authentification requise'
})
