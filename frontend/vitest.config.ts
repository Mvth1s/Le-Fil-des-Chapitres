import { defineVitestConfig } from '@nuxt/test-utils/config'

// environment: 'nuxt' : boot un contexte Nuxt minimal par fichier de test,
// pour que les auto-imports (composants App*, composables) et l'alias '~'
// utilises partout dans le projet fonctionnent tels quels dans les tests.
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
  },
})
