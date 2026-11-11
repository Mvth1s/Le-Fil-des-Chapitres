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
  typescript: {
    // Rattache les tests et vitest.config.ts aux tsconfig generes par Nuxt
    // (chemins relatifs a .nuxt/) : alias '~', auto-imports et typed linting
    // ESLint sans passer par allowDefaultProject (plafonne a 8 fichiers).
    appTsConfig: { include: ['../tests/**/*'] },
    nodeTsConfig: { include: ['../vitest.config.ts'] },
  },
  runtimeConfig: {
    // Prive : uniquement accessible cote serveur (SSR), jamais expose au
    // navigateur. Le rendu SSR tourne DANS le conteneur frontend, qui doit
    // joindre le backend via le reseau Docker interne, pas via localhost.
    apiBaseServer: 'http://backend:3333/api',
    public: {
      // Expose au navigateur : utilise apres l'hydratation, quand le code
      // s'execute sur la machine de l'utilisateur (hors reseau Docker).
      apiBase: 'http://localhost:3333/api',
    },
  },
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
        // favicon.ico reste servi par convention Nuxt (public/favicon.ico) ;
        // ce lien PNG est prefere par les navigateurs qui le supportent.
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
})