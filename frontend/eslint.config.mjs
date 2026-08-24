// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // vitest.config.ts et les fichiers de test ne font partie d'aucun
  // tsconfig genere par Nuxt (qui ne couvre que app/, server/, etc.) :
  // sans cette exception, le linting "type-aware" echoue avec "was not
  // found by the project service". Un seul niveau de wildcard autorise par
  // typescript-eslint (contrainte de perf), pas de "**".
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['vitest.config.ts', 'tests/components/*.spec.ts'],
        },
      },
    },
  }
)
