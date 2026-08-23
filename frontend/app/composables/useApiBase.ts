/**
 * Choisit la bonne base d'API selon le contexte d'execution : le rendu SSR
 * tourne dans le conteneur frontend (reseau Docker interne), l'hydratation
 * cote navigateur tourne sur la machine de l'utilisateur (localhost). Voir
 * nuxt.config.ts. A prefixer devant le chemin de chaque appel useFetch.
 */
export function useApiBase() {
  const config = useRuntimeConfig()
  return import.meta.server ? config.apiBaseServer : config.public.apiBase
}
