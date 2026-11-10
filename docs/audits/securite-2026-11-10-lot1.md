# Audit securite - lot 1 - 2026-11-10

Agent : `auditeur-securite`. Branche : `dev` (HEAD `77744ec`). Lecture seule.
Les valeurs sensibles (noms, adresses, cles) sont masquees dans ce rapport.

## En tete : secret reel dans l'historique

**Non.** gitleaks remonte une seule trouvaille, dans l'historique comme dans l'arbre courant :
`APP_KEY` en dur dans `.github/workflows/ci.yml:92` (commit d'introduction `5f458c0`).
Analyse : cle fixe d'un job CI ephemere (Postgres de service, aucune donnee reelle), commentee
comme telle. **Faux positif au sens "fuite"**, a condition que cette valeur ne soit reutilisee
ni dans un `.env` local ni sur Render. A verifier par Mvth1s (l'agent n'a pas lu les `.env`).

Commandes :

- `docker run --rm -v "$PWD:/repo:Z" zricethezav/gitleaks:latest detect --source=/repo --log-opts=--all --redact -v` : 24 commits scannes (29 au total, merges inclus), 1 trouvaille.
- `... detect --source=/repo --no-git --redact` : 1 trouvaille (la meme).
- Les valeurs `changeme` ne sont pas detectees par gitleaks (faible entropie) mais sont traitees ci-dessous.

## Fichiers `.env`

- Aucun `.env` suivi par git (`git ls-files` ne liste que les `.env.example` et `backend/start/env.ts`).
- `.env`, `backend/.env`, `frontend/.env` sont ignores (`.gitignore:27`, `backend/.gitignore:7`, `frontend/.gitignore:22`).
- Contenu des `.env` non lu, conformement a la consigne.

## Donnees personnelles

### Arbre courant

Prenom reel de l'auteur (masque `M*****`) present dans 4 fichiers suivis. Aucune adresse mail
trouvee dans l'arbre suivi (hors `package-lock.json`). `LICENSE` et `package.json` : uniquement
`Mvth1s` ou rien. Images de `logo/` et `frontend/public/` : aucune metadonnee texte d'auteur.

| Fichier:ligne | Nature |
|---|---|
| `backend/database/seeders/user_seeder.ts:15` | prenom en minuscules comme `username` |
| `frontend/app/components/AppButton.vue:75` | prenom dans un commentaire |
| `roadmap.md:55` | prenom dans une regle de fusion |
| `Maquette/le_fil_des_chapitres_mockups.html:137` | prenom dans un texte de maquette |

### Historique Git : identites d'auteur / committer

| Identite masquee | Commits | SHA courts |
|---|---|---|
| `M***** A*****` <`1411...+Mvth1s@users.noreply.github.com`> (committer : GitHub) | 20 | 77744ec 1bf8ebd c020652 56d155d a59d831 dc390c3 6b66ba4 15deb42 edaf67e 5f92177 0ef2458 5676431 f74136d 2088913 60ec0a8 d7bb545 c7c3944 32a826c a2a461d 03de286 |
| `Mvth1s` <`a***********@g****.com`> (adresse personnelle) | 2 | a722bf1 df08dd0 |
| `Mvth1s` <`m****+github@p*.me`> (alias de la boite pseudonyme admise) | 7 | 78c0fa6 0c4cd27 8654d12 0c08361 5f458c0 722441f e86c856 |

Remarques :

- Les 20 commits au nom reel sont les merges de PR faits via l'interface GitHub : le nom
  vient du **profil GitHub** (champ "Name"), pas de la config git locale. Tant que ce champ
  n'est pas change, chaque merge web futur reintroduira le nom reel.
- L'alias `+github` est sur la meme boite que l'adresse admise (`+lfdc`) : pas de fuite
  nouvelle, ecart mineur de convention.

### Historique Git : contenu des fichiers

Le commit `8654d12` (anonymisation) n'a nettoye que l'arbre. Les anciennes versions contiennent
encore le prenom et/ou le nom (masques) dans : `CAHIER_DES_CHARGES.md`, `CLAUDE.md`, `README.md`,
`LICENSE`, `roadmap.md`, `backend/database/seeders/user_seeder.ts`, `AppButton.vue`, maquette.
Commits concernes (`git log --all -G`) : 03de286 32a826c a722bf1 c7c3944 d7bb545 df08dd0 0ef2458 5676431 60ec0a8 8654d12.

### Options pour l'historique (decision de Mvth1s)

1. **Laisser tel quel.** Corriger l'arbre courant et le profil GitHub, accepter que l'historique
   public garde le nom. Aucun risque operationnel. Le depot etant deja public, les forks, clones
   et caches (GitHub, archives) conservent de toute facon l'historique actuel.
2. **Reecrire l'historique** avec `git filter-repo` (`--mailmap` pour les identites,
   `--replace-text` pour le contenu), puis force-push de toutes les branches et tags.
   Consequences : tous les SHA changent, PR existantes desynchronisees, clones locaux a refaire,
   protections de branche `main`/`dev` a lever temporairement. GitHub peut garder les anciens
   commits accessibles par SHA (refs de PR) : demande de purge au support GitHub necessaire
   pour un effacement complet. La branche distante `origin/copilot/scan-sensitive-data-exposure`
   contient 4 commits concernes et devrait etre reecrite ou supprimee.

Dans les deux cas : changer le "Name" du profil GitHub et configurer `user.name`/`user.email`
locaux sur le pseudo et l'adresse admise.

## Confirmation du tableau d'entree

| Fichier | Constat attendu | Statut |
|---|---|---|
| `docker-compose.yml` | `POSTGRES_PASSWORD: changeme` en dur | **Confirme** (`:11`) |
| `.github/workflows/ci.yml` | `APP_KEY` et mot de passe Postgres en dur | **Confirme** (`:71`, `:84`, `:92`) |
| `backend/database/seeders/user_seeder.ts` | Nom reel et mot de passe `changeme` en dur | **Confirme** (`:15`), limite a development/test (`:12`) |
| `backend/.env.example`, `.env.example` | Valeurs plausibles au lieu de marqueurs | **Confirme partiellement** : `APP_KEY=` est vide (correct), mais `DB_PASSWORD=changeme` (`backend/.env.example:12`, `.env.example:7` et `:28`) |
| `AppButton.vue`, `roadmap.md`... | Prenom reel de l'auteur | **Confirme** (voir liste ci-dessus, plus la maquette) |
| Historique Git | Auteurs avec nom reel et adresse personnelle | **Confirme** (22 commits) |
| `backend/config/cors.ts` | `origin: true` avec `credentials: true` | **Confirme** (`:11`, `:15`) |

## Tableau des constats

| # | Constat | Fichier:ligne | Gravite | Correction attendue | Agent |
|---|---|---|---|---|---|
| 1 | CORS reflete toute origine avec `credentials: true` | `backend/config/cors.ts:11,15` | important (bloquant des qu'une auth par cookie existe) | Liste blanche lue depuis l'env (ex. `CORS_ORIGINS`, domaine Vercel + localhost en dev), `credentials: false` tant qu'il n'y a pas d'auth | deploiement |
| 2 | Nom reel dans 20 commits de merge (profil GitHub) et adresse personnelle dans 2 commits | historique, SHA ci-dessus | important | Changer le Name du profil GitHub ; decision filter-repo par Mvth1s | Mvth1s (hors agents) |
| 3 | Prenom reel dans l'arbre courant | `user_seeder.ts:15`, `AppButton.vue:75`, `roadmap.md:55`, `Maquette/le_fil_des_chapitres_mockups.html:137` | important | Remplacer par `Mvth1s` (ou nom generique dans le seeder et la maquette). `roadmap.md` necessite demande explicite | backend-adonisjs (seeder), frontend-nuxt (AppButton, maquette), docs-keeper (roadmap) |
| 4 | Mot de passe `changeme` en dur dans compose | `docker-compose.yml:11` | important | `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}` lu depuis `.env` | deploiement |
| 5 | Mot de passe utilisateur `changeme` en dur dans le seeder | `backend/database/seeders/user_seeder.ts:15` | mineur (seeder limite a dev/test, pas d'auth) | Lire depuis l'env ou generer un aleatoire ; important avant la phase auth | backend-adonisjs |
| 6 | `APP_KEY` et mot de passe Postgres en dur dans la CI | `.github/workflows/ci.yml:71,84,92` | mineur | Generer l'`APP_KEY` dans un step (`node ace generate:key`) ou passer par `secrets.*` ; verifier que la valeur n'est reutilisee nulle part | deploiement |
| 7 | `.env.example` avec mot de passe plausible | `.env.example:7,28`, `backend/.env.example:12` | mineur | Marqueur explicite (`DB_PASSWORD=` vide + commentaire "a definir") | deploiement |
| 8 | Workflow sans bloc `permissions` (jeton `GITHUB_TOKEN` aux droits par defaut du depot) | `.github/workflows/ci.yml` (aucune ligne `permissions`) | important | `permissions: contents: read` au niveau du workflow | deploiement |
| 9 | Actions epinglees par tag majeur (`@v5`), pas par SHA | `.github/workflows/ci.yml:21,49,50,94,95,113,114,132,133,150,151,167,168` | mineur | Epingler `actions/checkout` et `actions/setup-node` par SHA complet + commentaire de version | deploiement |
| 10 | Pas de Dependabot | `.github/dependabot.yml` absent | mineur | Ajouter dependabot (npm backend, npm frontend, github-actions) | deploiement |
| 11 | `npm audit --omit=dev` backend : 1 critical, 3 high (16 au total) | `backend/package-lock.json` | important | `proxy-addr` (critical, transitif, correctif non cassant) et `brace-expansion` : mise a jour du lock. `@adonisjs/lucid` (direct) et `@faker-js/faker` : correctif = Lucid 22 (majeure), a arbitrer | backend-adonisjs |
| 12 | `npm audit --omit=dev` frontend : 3 critical, 13 high (42 au total) | `frontend/package-lock.json` | important | Tous corrigeables sans majeure selon npm (`vue`, `vite`, `undici`, `devalue`, `seroval`, `simple-git`, `shell-quote`...). Mise a jour du lock a valider par Mvth1s (ajout/maj de dependance) | frontend-nuxt |
| 13 | Aucun en-tete de securite (pas de `@adonisjs/shield`, pas de `routeRules`/headers Nuxt ou Vercel) | `backend/start/kernel.ts:25-29`, `frontend/nuxt.config.ts` | mineur | API JSON : `X-Content-Type-Options: nosniff`, `Referrer-Policy` via middleware maison ; frontend : en-tetes via `vercel.json` ou `routeRules` (CSP, `X-Frame-Options`, HSTS) | backend-adonisjs, frontend-nuxt |
| 14 | Handler d'erreurs : stack traces seulement hors production (`debug = !app.inProduction`) | `backend/app/exceptions/handler.ts:9` | conforme sous condition | Verifier que `NODE_ENV=production` est bien defini sur Render (non verifiable depuis le depot) | deploiement |
| 15 | Bodyparser : pas de `limit` explicite pour `json` et `form` (defaut AdonisJS 1mb), `multipart` a 20mb alors qu'aucun upload n'existe | `backend/config/bodyparser.ts:14,22,50` | mineur | `limit` explicite reduit (ex. 100kb json/form) et multipart desactive ou abaisse tant que l'upload est bloque | backend-adonisjs |
| 16 | `devtools: { enabled: true }` | `frontend/nuxt.config.ts:4` | mineur | Sans effet en build de production ; a conditionner sur le mode dev par proprete | frontend-nuxt |
| 17 | Alias `+github` au lieu de l'adresse admise `+lfdc` (meme boite) | historique, 7 commits ci-dessus | mineur | `git config user.email` sur l'adresse admise pour les prochains commits | Mvth1s (hors agents) |

## Non verifie / hors perimetre

- Contenu des `.env` locaux et variables Render/Vercel/Neon (reutilisation eventuelle de l'`APP_KEY` CI, `NODE_ENV` en prod).
- Comptes BDD Neon (moindre privilege) : non visible depuis le depot.
- La branche `origin/copilot/scan-sensitive-data-exposure` n'a ete couverte que par gitleaks `--all` et le decompte d'identites.
- `npm audit` lance en lecture seule, aucun `npm audit fix` execute.
