/**
 * Garde-fou de production : refuse de demarrer si une variable obligatoire
 * est vide ou contient encore un marqueur "<...>" d'un fichier d'exemple.
 *
 * import.meta.dev est remplace a la compilation par Nitro (true en
 * `nuxt dev`, false dans un build) : le test ne depend donc pas de NODE_ENV
 * au runtime, fiable sur Vercel comme en local.
 *
 * Pourquoi lever une erreur suffit : Nitro execute les plugins a
 * l'initialisation du serveur et relance toute erreur (nitropack
 * runtime/internal/app.mjs). En serveur Node, le process s'arrete au
 * demarrage ; sur Vercel (serverless), le chargement de la fonction echoue
 * a chaque invocation, donc toute requete dynamique (pages SSR, /api)
 * recoit une 500 de la plateforme. Les fichiers statiques servis par le CDN
 * ne passent pas par cette fonction.
 */
const REQUIRED_KEYS = ['basicAuthUser', 'basicAuthPassword', 'apiKey', 'apiUpstream'] as const

export default defineNitroPlugin(() => {
  if (import.meta.dev) return
  const config = useRuntimeConfig()
  const invalid = REQUIRED_KEYS.filter((key) => !config[key] || config[key].startsWith('<'))
  if (invalid.length > 0) {
    // Seuls les noms des cles sont cites, jamais leurs valeurs.
    throw new Error(`Missing or placeholder runtime config in production: ${invalid.join(', ')}`)
  }
})
