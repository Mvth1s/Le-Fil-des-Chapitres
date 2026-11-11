# Release 0.1.0 : suivi de mission

Fichier de suivi persistant de la finalisation de la Phase 1 (MVP v0.1.0).
Si une session s'interrompt, la suivante repart d'ici.

## Avancement par lot

- [x] Lot 1 : audit et vérification des hypothèses (rapport sécurité : `docs/audits/securite-2026-11-10-lot1.md`)
- [x] Lot 2 : `fix/security-baseline-secrets` (PR #18) (testé sur clone propre : compose up OK, rôles owner/app/ro, CRUD via `_app`)
- [x] Lot 3 : `docs/agents-and-alignment` (PR #19)
- [ ] Lot 4 : fonctionnalités manquantes
- [ ] Lot 5 : `test/backend-reading-list-and-stats`
- [ ] Lot 6 : `deploy/alwaysdata-vercel`
- [ ] Lot 7 : release v0.1.0 sur `main`

## Agents

| Agent | Créé en | Rôle |
|---|---|---|
| `auditeur-fonctionnel` | Lot 1 | Comparer l'appli réelle aux US du cahier |
| `verificateur-hypotheses` | Lot 1 | Vérifier les hypothèses H1 à H12 |
| `auditeur-securite` | Lot 1 | Auditer le dépôt contre le socle de sécurité |
| `testeur-backend` | Lot 3 | Écrire les tests fonctionnels Japa |
| `testeur-frontend` | Lot 3 | Écrire les tests Vitest |
| `gardien-securite-doc` | Lot 3 | Tenir `docs/SECURITE.md` |

Agents existants mis en conformité au lot 3 : `backend-adonisjs`, `frontend-nuxt`,
`deploiement`, `code-reviewer`, `docs-keeper`. Écarts au tableau 2.3 du prompt :
- `backend-adonisjs` couvre aussi `backend/ace.js`, `adonisrc.ts`, `tsconfig.json`,
  `eslint.config.js` et `bin/**` (configuration du framework, sans propriétaire sinon ;
  nécessaire à la migration AdonisJS 7).
- `deploiement` couvre aussi `.gitleaksignore`, tout `.github/**` et les `.dockerignore`.
- `frontend-nuxt` couvre aussi la configuration du framework (`tsconfig.json`,
  `eslint.config.mjs`, `vitest.config.ts`, `.nuxtrc`).
- Fichiers restant à l'orchestrateur : `package.json` et lockfiles (dépendances),
  `.gitignore`, `.nvmrc`, `backend/.editorconfig`, `frontend/README.md`, `Maquette/`.
- `docs-keeper` exclut `CLAUDE.md` (interdit commun) et `docs/release-*.md` (fichier de
  l'orchestrateur et des auditeurs). Les modifications de `CLAUDE.md` et des fichiers
  d'agents sont faites par l'orchestrateur.

Note : au lot 1, les trois agents n'étaient pas encore chargés nativement ; ils ont été
lancés via un agent générique appliquant leur fichier de rôle. Ils sont natifs ensuite.

## Décisions

- gitleaks est exécuté via l'image Docker officielle `zricethezav/gitleaks` (binaire absent
  localement, aucune installation système).

## Écarts fonctionnels

Audit du 2026-11-10 sur `dev` (77744ec). **Vérification runtime impossible** :
`docker compose up -d --build` échoue car `backend/.env` et `frontend/.env` sont absents
(`docker-compose.yml:31-32` et `:51-52` les exigent ; seul `.env` racine existe). Aucun
curl n'a donc pu être joué (ports 3333 et 3000 : connexion refusée). Les preuves
ci-dessous viennent de la lecture du code (routes, controllers, modèle, pages Nuxt). A
rejouer en runtime une fois les `.env` en place.

Chemins : `B/` = `backend/`, `F/` = `frontend/app/`.

| US | Statut | Preuve | Manque précis |
|---|---|---|---|
| US-01 Ajouter au catalogue | partielle | `B/start/routes.ts:26`, `B/app/controllers/webtoons_controller.ts:19-42`, titre unique `B/app/validators/create_webtoon.ts:21` + migration webtoons `:10`, `F/pages/catalogue/new.vue`, `F/components/WebtoonForm.vue:64-112` | Pas de création de genre à la volée (aucun `POST /api/genres`, cases à cocher sur le référentiel seul). Upload de couverture absent (bloqué volontairement, URL seule : conforme CLAUDE.md section 11). |
| US-02 Modifier | couverte | `B/start/routes.ts:27`, `webtoons_controller.ts:44-78`, `F/pages/catalogue/[id]/edit.vue:33-34` (erreurs 422 affichées) | Rien. |
| US-03 Supprimer | partielle | Cascade OK : `B/database/migrations/1787509883756_create_user_webtoons_table.ts:17`, `..._create_webtoon_genres_table.ts:13`. Front : `F/pages/catalogue/[id]/index.vue:24-35` | Confirmation via `confirm()` natif (`:25`), pas de modale du design system. Correction de l'écart présumé : il n'y a **pas** d'`alert()` ici, il n'y a **aucune** gestion d'erreur (`try/finally` sans `catch`) : un DELETE en échec est silencieux pour l'utilisateur (rejet de promesse non géré). Les `alert()` sont dans `F/pages/liste/index.vue:67,90`. |
| US-04 Consulter le catalogue | partielle | `F/pages/catalogue/index.vue:41-63` (grille de cartes seule), tri fixe `webtoons_controller.ts:10` (`title asc`) | Pas de bascule grille / liste. Pas de tri (date d'ajout, nb chapitres). Pas de filtres (genre, statut de lecture, auteur). Cartes sans couverture (voir ligne Couverture). |
| US-05 Ajouter à ma liste | partielle | Back OK : `B/start/routes.ts:33`, `user_list_controller.ts:22-52`, 409 doublon `:32-34`, dates auto `B/app/models/user_webtoon.ts:91-96`. Front : aucun appel `POST /user/list` dans `F/` (grep `user/list` : seulement GET/PUT/PATCH) | Confirmé : aucun bouton "Ajouter à ma liste" sur la fiche (`F/pages/catalogue/[id]/index.vue:52-78`) ni ailleurs. Fonctionnalité inaccessible depuis l'UI, la liste ne peut être alimentée que par API ou seed. |
| US-06 Progression | partielle | `+1 chapitre` : `F/pages/liste/index.vue:78-94,146-153`. Passage auto à `completed` : `B/app/models/user_webtoon.ts:78-89`. Plafond `chapters_total` : `user_list_controller.ts:116-120` | Confirmé : pas de champ de saisie directe du chapitre courant (le PATCH accepte pourtant une valeur absolue, `B/app/validators/update_progress.ts`). Le statut mis à jour par le back n'est visible qu'après `refresh()` (OK). |
| US-07 Modifier infos de lecture | partielle | Back OK : `user_list_controller.ts:54-82` (status, rating, comment, dates). Front : seul le statut est éditable, `F/pages/liste/index.vue:58-71,166-173` | Confirmé : pas d'édition de la note, du commentaire, des dates de début / fin. Ces champs ne sont même pas affichés sur la carte de liste ni sur la fiche. |
| US-08 Retirer de ma liste | partielle | Back OK : `B/start/routes.ts:36`, `user_list_controller.ts:98-102` (204) | Confirmé : aucun bouton "Retirer de ma liste" (aucun `DELETE /user/list` dans `F/`). |
| US-09 Rechercher | absente | grep `search|debounce|normalize` dans `F/` : 0 résultat. Aucun paramètre de requête côté `webtoons_controller.ts:9-12` ni `user_list_controller.ts:13-20` | Confirmé : aucune recherche (titre / auteur), ni temps réel, ni insensibilité casse / accents, ni sur le catalogue ni sur la liste. Le debounce 300 ms est exigé par le cahier section 11 (`CAHIER_DES_CHARGES.md:520`), absent aussi. |
| US-10 Filtrer et trier la liste | partielle | Filtres statut + genre : `F/pages/liste/index.vue:17-50,114-117`. Ordre fixe `updatedAt desc` : `user_list_controller.ts:18` | Confirmé : pas de filtre par note (ex : >= 8). Aucun tri (titre A-Z / Z-A, date d'ajout, note, % de progression). |
| US-11 Statistiques | partielle | `B/start/routes.ts:38`, top 3 genres `B/app/controllers/stats_controller.ts:39-40`, top 5 notés `:46-47`, `F/pages/statistiques/index.vue:30-72` | "Répartition par statut (graphique)" : rendue en simple liste de badges + nombres (`:41-49`), pas de graphique. Le reste (total, chapitres lus, top 3, top 5) est présent. |
| Couverture (`cover_url`) | absente à l'affichage | Saisie OK : `F/components/WebtoonForm.vue:78-84`. Aucun `<img>` / usage de `coverUrl` dans `F/pages/` (grep) | Confirmé : la couverture n'est affichée ni sur les cartes du catalogue, ni sur la fiche, ni sur la liste. Contredit US-04 "cartes visuelles avec couverture". |
| Tests backend | partielle | `B/tests/functional/` : `genres.spec.ts` (1 test), `webtoons.spec.ts` (GET liste, GET 404, rejet protocoles URL, POST https) | Confirmé : aucun test pour `/api/user/list` (store, doublon 409, update, progress, plafond, passage auto à `completed`, destroy) ni pour `/api/stats`. Les webtoons n'ont pas non plus de test de titre dupliqué, de PUT nominal ni de DELETE avec cascade. |
| Ergonomie erreurs liste | écart annexe | `F/pages/liste/index.vue:67,90` | `alert()` natif pour les erreurs de changement de statut et de progression, hors design system. |

## Hypothèses

Sources consultées le 2026-11-10. Statuts : confirmée, partielle, infirmée, non vérifiable.

| # | Statut | Preuve | Conséquence |
|---|---|---|---|
| H1 | confirmée (mesure locale du 2026-11-11), avec réserve au déploiement | Doc : la limite RAM est un "maximum limit that an account can reach at a given time" ; au dépassement "a process (not necessarily the most consuming) is automatically killed" (https://help.alwaysdata.com/en/docs/technical-specifications/system-resources-alerts-and-limitations/, consulté le 2026-11-11 ; mode de calcul non documenté). Mesure : Node 24.22.2, `node ace build` puis `npm ci --omit=dev` dans `build/` (`node_modules` 105 Mo), Postgres 16 jetable comme le job CI `backend-test` (secrets `openssl rand` jamais écrits, migrations en `lfdc_owner`, seed, serveur en `lfdc_app`), `NODE_ENV=production`, `API_KEY` 64 hex, `node build/bin/server.js`, lecture de `/proc/<pid>/status`. Charge : 500 requêtes successives (GET webtoons/stats/user/list/genres, POST/PUT/DELETE webtoons, POST/PATCH/DELETE user/list, toutes en 2xx), puis 1500 de plus, puis 10 s de repos. Résultats bruts (VmRSS repos / après 500 / VmHWM après 2000) : sans option 144 688 / 160 952 / 165 220 kB (2e passe 144 956 / 162 092 / 164 780 kB) ; `--max-old-space-size=128` 138 080 / 155 324 / 157 076 kB ; `=160` 138 320 / 152 876 / 157 216 kB. Détail à 2000 requêtes (160) : RssAnon 98 568 kB, RssFile 60 440 kB. Process `node ace migration:run --force` (sans migration à jouer, build, production) : VmHWM 142 036 kB sans option, 135 720 kB avec 128 (RssAnon 82 280 kB, RssFile 58 580 kB). | Le serveur seul plafonne vers 157-165 Mo, la RAM reste stable après la charge : il tient sous 256 Mo. Recommandation : `NODE_OPTIONS=--max-old-space-size=128` sur le site alwaysdata (gain ~7 Mo, tas réel bien en dessous ; ~90 Mo de marge). Réserve : la limite est par compte. Pendant un déploiement, `migration:run` (et `psql`, `db:seed`) tourne en SSH à côté du site en marche : ~160 + ~140 Mo en RSS cumulé (~240 Mo si les pages du binaire Node sont partagées), au ras ou au-delà de 256 Mo, avec risque de kill d'un process au hasard. Atténuations possibles (décision hors de ce rôle) : passer aussi `NODE_OPTIONS=--max-old-space-size=128` aux commandes `node ace` du workflow, ou arrêter le site avant les migrations. |
| H2 | non vérifiable (probable) | La doc PostgreSQL décrit des utilisateurs créés séparément avec leurs propres permissions, sans restriction propre au Free (https://help.alwaysdata.com/en/docs/web-hosting/databases/postgresql/). La page des prix Free ne mentionne aucune limite d'utilisateurs ni de bases : seulement "1 GB", "256 MB", "1/4" CPU, "3 days" (https://help.alwaysdata.com/en/docs/admin-billing/billing/public-cloud-prices/). Aucun texte officiel ne l'affirme explicitement. | À constater à la création du compte. Repli prévu : deux comptes minimum (`_owner` et `_app`). |
| H3 | partielle (doc favorable, test réel au déploiement) | Doc officielle (reconsultée le 2026-11-11, aucune date de mise à jour sur la page) : "any validation via the administration interface (or via the API) will reset the permissions". La plateforme ne propose que deux profils : "all privileges" (REVOKE ALL puis GRANT ALL, ALTER DEFAULT PRIVILEGES GRANT ALL sur TABLES/SEQUENCES/FUNCTIONS) et "read only" (GRANT CONNECT, GRANT USAGE sur les schémas, ALTER DEFAULT PRIVILEGES GRANT SELECT sur TABLES/SEQUENCES, GRANT EXECUTE sur FUNCTIONS) ; aucun profil lecture-écriture ni personnalisé (https://help.alwaysdata.com/en/docs/web-hosting/databases/postgresql/). Aucune nouvelle source officielle trouvée. `backend/database/sql/grants.sql` contient déjà `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role`. | Les GRANT de `_owner` tiennent tant qu'on ne revalide pas `_app` (interface OU API). Créer `_app` en profil "read only" (le plus proche du besoin) puis laisser `grants.sql` ajouter le DML ; le workflow réexécute `grants.sql` à chaque déploiement, ce qui répare une revalidation accidentelle. Test réel au déploiement toujours requis. |
| H4 | partielle | Doc : "Your application must absolutely listen to IP and the port shown in the site configuration", "The `IP` / `HOST` and `PORT` environment variables can also be used" (https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/). La valeur exacte de HOST n'est pas documentée. Mesure locale, validateur réellement utilisé par `@adonisjs/env` 6.2.0 (`@poppinss/validator-lite` 2.1.2), depuis `backend/` : `node --input-type=module -e "import { schema } from '@poppinss/validator-lite'; const v = schema.string({ format: 'host' }); ..."`. Résultat brut : `"::" OK`, `"0.0.0.0" OK`, `"127.0.0.1" OK`, `"10.0.0.12" OK`, `"::1" OK`, `"2a00:b6e0:1:20:3::1" OK`, `"localhost" OK`, `"postgresql-moncompte.alwaysdata.net" OK`, `"[::1]" REJECT`, `"" REJECT`. | Toute IPv4 ou IPv6 nue passe ; seule une IPv6 entre crochets serait rejetée. Pas d'assouplissement à prévoir a priori ; relever la valeur réelle de HOST au premier démarrage (log). |
| H5 | confirmée | "You can set a new default region through your project's settings" ; tableau Limits : "Hobby : Single region" ; défaut `iad1` "for all new projects" ; clé `"regions"` de `vercel.json` (https://vercel.com/docs/functions/configuring-functions/region). `cdg1` = "eu-west-3, Paris, France" (https://vercel.com/docs/regions). | Fixer `"regions": ["cdg1"]` (une seule région) dans `vercel.json` ou dans Settings > Functions. Plus d'une région en Hobby fait échouer le déploiement. |
| H6 | partielle | Hôte "postgresql-[account].alwaysdata.net", port 5432, pgBouncer sur 5433, 50 connexions simultanées max par utilisateur en Public Cloud (https://help.alwaysdata.com/en/docs/web-hosting/databases/postgresql/). L'exemple `psql` est lancé depuis SSH ; ni l'accès depuis l'extérieur ni TLS ne sont documentés. | Exécuter les migrations en SSH sur le serveur (ou au démarrage du site), pas depuis le runner GitHub. `DB_SSL` : non documenté, à tester avec `sslmode=require` puis `\conninfo` ; le backend étant sur la même infra, l'absence de TLS est un risque réduit mais à consigner. |
| H7 | partielle | Endpoint exact : `POST https://api.alwaysdata.com/v1/site/<id>/restart/`, authentification basic avec la clé en utilisateur suivie de ` account=<compte>` (https://help.alwaysdata.com/en/docs/development/api/examples/). Auth : basic, clé en utilisateur, mot de passe vide (https://help.alwaysdata.com/en/docs/development/api/usage/). Jeton : "have the same permissions as the profile they are linked to", restriction possible à "only few IPs", 2FA obligatoire pour créer un jeton (https://help.alwaysdata.com/en/docs/admin-billing/profile/tokens/). Permissions par compte et par service, dont "Sites" (https://help.alwaysdata.com/en/docs/admin-billing/permissions/). | Pas de jeton à portée réduite en soi. Pour limiter : créer un second profil n'ayant que la permission "Sites" sur le compte et générer le jeton sur ce profil (non testé). Restriction IP inutilisable avec les runners GitHub (IP variables). Repli plus simple : redémarrage via SSH (non documenté côté alwaysdata, voir notes) ou bouton Restart. |
| H8 | confirmée (avec réserve) | Hôte "ssh-[account].alwaysdata.net", port 22, identifiant "assigned user and password OR SSH keys", SSH disponible dans "ALL of their environments" (https://help.alwaysdata.com/en/docs/web-hosting/remote-access/ssh/). Seul filtrage documenté : "An IP blockage occurs after some ten failed attempts" (https://help.alwaysdata.com/en/docs/web-hosting/remote-access/ssh/troubleshooting/). Ports sortants : "No filtering" (https://help.alwaysdata.com/en/docs/technical-specifications/limits/). | Aucune restriction d'IP documentée pour SSH : déploiement par clé SSH depuis GitHub Actions possible. Fixer `known_hosts` pour éviter les échecs d'auth répétés qui bloqueraient l'IP du runner. |
| H9 | confirmée | Versions listées : "24, 22, 20, 18, 16, 14, 12, 10, 8, 6", "Only LTS versions are made available" ; choix par défaut dans "Environment > Node.js" ou variable `NODEJS_VERSION` (https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/). | Node.js 22 utilisable. |
| H10 | confirmée | "Our servers are hosted in France, in the Paris region." ; "For our main datacenters, we rely on the expertise of Equinix." ; données chiffrées au repos (https://help.alwaysdata.com/en/docs/technical-specifications/architecture/). Société ALWAYSDATA SARL, 75008 Paris (https://www.alwaysdata.com/en/contract/16). Sauvegardes dans un datacenter "several kilometers away", "run by another provider" (https://help.alwaysdata.com/en/docs/web-hosting/backups/). | Hébergement et juridiction français. Écart mineur : le prestataire du datacenter de sauvegarde n'est pas nommé. |
| H11 | confirmée | `GITLEAKS_LICENSE` "required for organizations, not required for user accounts" ; usage `gitleaks/gitleaks-action@v3` ; `GITHUB_TOKEN` requis (fourni automatiquement) (https://github.com/gitleaks/gitleaks-action). Licence de l'action depuis v2 : EULA propriétaire Gitleaks LLC, aucune clé pour un "Personal Account" (https://raw.githubusercontent.com/gitleaks/gitleaks-action/master/LICENSE.txt). Binaire gitleaks : MIT, images `zricethezav/gitleaks` et `ghcr.io/gitleaks/gitleaks` (https://github.com/gitleaks/gitleaks). | Utilisable gratuitement tant que le dépôt reste sous le compte personnel. Si le dépôt passe dans une organisation, basculer sur le binaire MIT (image Docker) dans un step. |
| H12 | confirmée (mesure locale du lot 6, 2026-11-11) | Vérifié dans Chromium headless avec la CSP de base active : application Nuxt montée, polices chargées, navigation client vers `/catalogue` avec `GET /api/webtoons` en 200, aucun refus CSP dans la console. | Pas d'assouplissement de la CSP de base nécessaire. Revérifier après tout ajout de script, police ou origine externe. |

### Notes de déploiement alwaysdata

Toutes consultées le 2026-11-10.

- **Restrictions de l'offre Free** : "The Free plan cannot be used for profit purposes." ; "The creation of websites on this plan is limited to the `alwaysdata.net` account's address" ; "it cannot be used to run services." ; "The disk quota includes files, mails and databases." (https://help.alwaysdata.com/en/docs/admin-billing/billing/public-cloud-prices/). Conséquence : backend servi sur `<compte>.alwaysdata.net` uniquement (pas de domaine personnalisé), le site Node.js est un "site" et non un "service" ; le quota de 1 Go inclut la base PostgreSQL et `node_modules`.
- **Ressources Free** : 1 Go disque, 256 Mo RAM, 1/4 CPU, sauvegardes 3 jours (même page). Le nombre maximal de processus n'est pas documenté.
- **Mise en veille** : "Idle time before a site is stopped : 30 minutes by default, configurable" ; "Simultaneous instances of a site : 1, including during a restart" ; "Delay between SIGTERM and SIGKILL : 30 seconds" (https://help.alwaysdata.com/en/docs/technical-specifications/limits/). Conséquence : démarrage à froid après 30 min sans requête, et une coupure pendant chaque redémarrage (une seule instance).
- **Site Node.js** : champ *Command*, exemple `node /home/[account]/myapp/index.js` ; utiliser `node` ou `/usr/bin/node` ("`nodejs` does not work") ; écouter sur l'IP et le port fournis, exposés via `IP` / `HOST` et `PORT` (https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/). Pour AdonisJS : commande du type `node /home/<compte>/<app>/build/bin/server.js`, `HOST` et `PORT` lus directement par `start/env.ts`. Le répertoire de travail n'est pas documenté : utiliser des chemins absolus. Les variables d'environnement d'un site sont modifiables via le champ `environment` de l'API, format "FOO=bar LOREM=ipsum" (https://api.alwaysdata.com/v1/site/doc/).
- **Redémarrage** : bouton Restart, ou automatiquement à toute modification du site dans Web > Sites ou du menu Environment (https://help.alwaysdata.com/en/docs/web-hosting/sites/restart-a-site/) ; API `POST https://api.alwaysdata.com/v1/site/<id>/restart/`. Aucune commande SSH de redémarrage n'est documentée.
- **API** : limite de 10 requêtes par minute par défaut, 50 authentifié, 250 pour les méthodes sûres (https://help.alwaysdata.com/en/docs/development/api/usage/).
- **SSH** : `ssh <compte>@ssh-<compte>.alwaysdata.net`, port 22, utilisateurs SSH gérés dans Remote access > SSH/SFTP ; pas d'accès root (https://help.alwaysdata.com/en/docs/web-hosting/remote-access/ssh/). Blocage d'IP après une dizaine d'échecs.
- **PostgreSQL** : `postgresql-<compte>.alwaysdata.net:5432`, pgBouncer sur 5433, versions 16, 17 et 18 proposées, 50 connexions par utilisateur, extensions activables à la création (pgcrypto, hstore, PostGIS...), les noms des bases et utilisateurs du serveur sont visibles des autres clients mais pas leur contenu (https://help.alwaysdata.com/en/docs/web-hosting/databases/postgresql/).
- **Sauvegardes** : quotidiennes (fichiers, bases via `pg_dump`, mails), conservées 3 jours en Free, stockées dans un datacenter distinct ; restauration par l'interface ou archive zstd (https://help.alwaysdata.com/en/docs/web-hosting/backups/). Trois jours de rétention : prévoir un export `pg_dump` personnel si l'historique compte.

- 2026-11-10 : Mvth1s valide `npm audit fix` (sans `--force`) côté backend et frontend.
  La faille élevée restante (`@faker-js/faker` embarqué par Lucid 21) n'a de correctif que
  via Lucid 22, qui exige AdonisJS 7 et Node.js 24. Mvth1s valide la migration complète
  vers AdonisJS 7 (core 7.6, Lucid 22.4, guide officiel https://docs.adonisjs.com/v6-to-v7).
  Mises à jour de paquets faites par l'orchestrateur (les agents n'ont pas le droit de
  toucher aux dépendances). CLAUDE.md et le cahier passent à AdonisJS 7.x / Lucid 22.x,
  Node.js 24 partout (`.nvmrc`, Dockerfiles, CI ; disponible sur alwaysdata, voir H9).
- CI : au lieu des GitHub Secrets `CI_APP_KEY` / `CI_DB_PASSWORD` prévus, la CI génère des
  valeurs aléatoires masquées à chaque run. Aucune valeur en dur, rien à stocker ni à
  faire tourner, et la CI fonctionne avant toute création de secret.
- gitleaks en CI : binaire officiel (MIT) téléchargé et vérifié par SHA-256, pas
  `gitleaks-action` (EULA propriétaire depuis la v2, voir H11).
- Prénom réel remplacé par le pseudo dans `AppButton.vue` et `Maquette/` par
  l'orchestrateur (remplacement d'un mot, la maquette n'a pas d'agent propriétaire) ;
  `roadmap.md` corrigé par `docs-keeper` au lot 3.
- H6 (accès externe PostgreSQL non documenté) : migrations, GRANT et bootstrap exécutés en
  SSH sur le serveur alwaysdata, compte `_owner` passé en variable de la commande.
- H7 (pas de jeton API à portée réduite) : profil alwaysdata dédié avec la seule permission
  "Sites", jeton créé sur ce profil ; à défaut, redémarrage manuel documenté.

## Points ouverts

- Historique Git : 20 merges GitHub portent le nom réel (champ "Name" du profil GitHub),
  2 commits une adresse personnelle, et 10 commits contiennent le prénom dans d'anciennes
  versions de fichiers. Rien n'est réécrit : décision de Mvth1s (voir rapport lot 1).
- Champ "Name" du profil GitHub : à remplacer par le pseudo pour que les futurs merges
  faits sur GitHub ne réintroduisent pas le nom réel.
- Identité Git locale : nom `Mvth1s` correct, adresse en alias `+github` de la boîte
  pseudonyme (écart mineur avec l'adresse de contact `+lfdc`).
- Tirets cadratins hérités (antérieurs à la mission) : 31 dans `CAHIER_DES_CHARGES.md`,
  14 dans `README.md`. Non modifiés (hors périmètre, modification minimale) ; les fichiers
  produits pendant la mission n'en contiennent aucun. Nettoyage à décider par Mvth1s.
- Les restrictions des agents (Bash limité, pas de Git en écriture) sont déclaratives :
  aucune règle `permissions.deny` dans `.claude/settings.json` ne les impose. Ajouter de
  telles règles relève d'un réglage de permissions : décision de Mvth1s (audit lot 3, M3).
