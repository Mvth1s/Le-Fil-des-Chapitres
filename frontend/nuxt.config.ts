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
      ],
    },
  },
})