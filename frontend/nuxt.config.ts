// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    // typescript.tsconfigPath active les regles ESLint "type-aware"
    // (typescript-eslint), qui s'appuient sur les vrais types du projet
    // plutot que sur une simple analyse syntaxique.
    ['@nuxt/eslint', { config: { typescript: { tsconfigPath: './tsconfig.json' } } }],
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Le Fil des Chapitres',
      link: [
        // preconnect : accelere le chargement des polices Google Fonts
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap',
        },
      ],
    },
  },
})