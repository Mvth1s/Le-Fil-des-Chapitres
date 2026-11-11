/**
 * Proxy Nitro : le navigateur (et le rendu SSR) ne parle qu'au frontend sur
 * /api/** ; cette route relaie la requete vers le backend
 * (runtimeConfig.apiUpstream) en ajoutant la cle X-Api-Key, qui ne quitte
 * donc jamais le serveur.
 *
 * Choix volontaires :
 * - en-tetes du client relayes par LISTE BLANCHE : jamais Authorization (Basic
 *   Auth du navigateur), Cookie ni Host ne partent vers le backend ;
 * - reponse renvoyee telle quelle (code, corps, content-type), y compris les
 *   422 de validation, mais sans les autres en-tetes du backend ;
 * - erreur reseau vers le backend : 502 generique, sans detail interne ;
 * - delai depasse : 504 ; corps entrant > 100 ko : 413 sans appeler le backend.
 */
const FORWARDED_HEADERS = ['accept', 'content-type', 'accept-language']
const BODY_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
// Statuts qui interdisent un corps de reponse (new Response leve sinon).
const NULL_BODY_STATUSES = [101, 204, 205, 304]
// Meme limite que le bodyparser du backend (100kb = 100 * 1024 octets).
const MAX_BODY_BYTES = 100 * 1024
// Au-dela, on renvoie 504 plutot que de bloquer la fonction jusqu'a sa limite.
const UPSTREAM_TIMEOUT_MS = 10_000

export default defineEventHandler(async (event) => {
  const { apiUpstream, apiKey } = useRuntimeConfig(event)
  if (!apiUpstream) {
    // Seulement possible en dev : en production check-env.ts bloque le demarrage.
    console.error('[api proxy] NUXT_API_UPSTREAM manquant : impossible de joindre le backend')
    setResponseStatus(event, 502)
    return { message: 'Bad gateway' }
  }

  // event.path = chemin brut + query, ex. "/api/webtoons/42?x=1".
  const [rawPath = '', query] = event.path.replace(/^\/api\/?/, '').split(/\?(.*)/s, 2)

  // Chaque segment est decode puis re-encode : un "%2F" reste un seul segment,
  // et un "." / ".." (meme encode en %2e) ne peut pas remonter hors de /api.
  let segments: string[]
  try {
    segments = rawPath.split('/').map((s) => decodeURIComponent(s))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Bad request' })
  }
  if (segments.some((s) => s === '.' || s === '..')) {
    throw createError({ statusCode: 400, statusMessage: 'Bad request' })
  }
  const target = `${apiUpstream.replace(/\/+$/, '')}/${segments.map(encodeURIComponent).join('/')}${query ? `?${query}` : ''}`

  const headers: Record<string, string> = {}
  for (const name of FORWARDED_HEADERS) {
    const value = getRequestHeader(event, name)
    if (value) headers[name] = value
  }
  if (apiKey) headers['x-api-key'] = apiKey

  // content-length d'abord (rejet sans lire le corps), puis taille reelle lue
  // (corps chunked ou en-tete mensonger).
  // shortcut: un corps chunked est lu en entier avant le controle ; acceptable
  // car la plateforme plafonne deja la taille des requetes (4,5 Mo sur Vercel).
  const tooLarge = () => {
    setResponseStatus(event, 413)
    return { message: 'Payload too large' }
  }
  if (Number(getRequestHeader(event, 'content-length') ?? 0) > MAX_BODY_BYTES) return tooLarge()
  const body = BODY_METHODS.includes(event.method) ? await readRawBody(event, false) : undefined
  if (body && body.length > MAX_BODY_BYTES) return tooLarge()

  let upstream: Response
  let upstreamBody: ArrayBuffer | null
  try {
    upstream = await fetch(target, {
      method: event.method,
      headers,
      // Copie en Uint8Array : le type Buffer n'est pas accepte par BodyInit.
      body: body ? new Uint8Array(body) : undefined,
      // Une redirection du backend est renvoyee telle quelle, pas suivie.
      redirect: 'manual',
      // Couvre aussi la lecture du corps de la reponse ci-dessous.
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
    upstreamBody = NULL_BODY_STATUSES.includes(upstream.status) ? null : await upstream.arrayBuffer()
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      setResponseStatus(event, 504)
      return { message: 'Gateway timeout' }
    }
    setResponseStatus(event, 502)
    return { message: 'Bad gateway' }
  }

  const contentType = upstream.headers.get('content-type')
  return new Response(upstreamBody, {
    status: upstream.status,
    headers: contentType ? { 'content-type': contentType } : {},
  })
})
