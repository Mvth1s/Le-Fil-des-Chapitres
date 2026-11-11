/**
 * Base des appels d'API : toujours "/api", en SSR comme dans le navigateur.
 * Les deux passent par le proxy Nitro (server/api/[...path].ts), seul a
 * connaitre l'URL du backend et la cle X-Api-Key. En SSR, useFetch sur un
 * chemin relatif est traite en interne par Nitro, sans requete reseau.
 */
export function useApiBase() {
  return '/api'
}
