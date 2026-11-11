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
    // Tout est prive (serveur uniquement, jamais envoye au navigateur) et
    // surchargeable par variable d'environnement NUXT_<CLE_EN_SNAKE_CASE>.
    // URL du backend jointe par le proxy server/api/[...path].ts
    // (NUXT_API_UPSTREAM ; en Docker : http://backend:3333/api). Vide par
    // defaut : en production, server/plugins/check-env.ts refuse alors de
    // demarrer ; en dev, le proxy repond 502.
    apiUpstream: '',
    // Cle X-Api-Key ajoutee par le proxy (NUXT_API_KEY), exigee par le backend
    // quand son API_KEY est defini.
    apiKey: '',
    // Identifiants de la Basic Auth (server/middleware/basic-auth.ts) ;
    // vides = protection desactivee (dev local uniquement).
    basicAuthUser: '',
    basicAuthPassword: '',
  },
  // En-tetes de securite en production seulement : en dev, la CSP casserait
  // le HMR de Vite (websocket, scripts injectes).
  $production: {
    routeRules: {
      '/**': {
        headers: {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'same-origin',
          'X-Frame-Options': 'DENY',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
          'X-Robots-Tag': 'noindex, nofollow',
          // 'unsafe-inline' sur script-src : Nuxt injecte des scripts inline
          // (configuration runtime, payload SSR) sans nonce.
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self'",
            "img-src 'self' https: data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join('; '),
        },
      },
    },
  },
  app: {
    head: {
      title: 'Le Fil des Chapitres',
      // Instance privee : ne pas indexer (voir aussi public/robots.txt).
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
      link: [
        // Polices auto-hebergees (main.css) : precharge des deux fontes droites,
        // utilisees des le premier rendu. crossorigin est requis pour les fontes,
        // meme en meme origine, sinon le preload n'est pas reutilise.
        {
          rel: 'preload',
          href: '/fonts/dancing-script/DancingScript-Variable.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
        {
          rel: 'preload',
          href: '/fonts/playfair-display/PlayfairDisplay-Variable.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
        },
        // favicon.ico reste servi par convention Nuxt (public/favicon.ico) ;
        // ce lien PNG est prefere par les navigateurs qui le supportent.
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
})