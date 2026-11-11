# Audit sécurité - lot 6 (déploiement alwaysdata / Vercel)

Date : 2026-11-11. Branche `deploy/alwaysdata-vercel`, diff `origin/dev...HEAD` (8 commits,
`05b0eac` à `dbee8ce`). Référentiel : `docs/SECURITE.md` de la branche (sections 3.1 à 3.5 du
prompt de mission). Audit en lecture seule.

## Secrets réels dans l'historique

**Aucun secret réel trouvé.** gitleaks signale 2 trouvailles dans ce lot, toutes deux des
faux positifs (exemples de commande `curl -u "<jeton> account=<compte>:"` à marqueurs dans
`docs/DEPLOIEMENT.md`), mais **elles font échouer le job `secrets-scan` de la CI** sur la PR
(voir constat 1). La trouvaille historique `5f458c0` (`APP_KEY` fixe d'une ancienne CI) est
déjà connue (audit lot 1) et hors de la plage scannée par la CI.

## Verdict

**Bloquant : oui**, uniquement à cause du constat 1 (CI gitleaks rouge, PR non fusionnable).
Aucune faille exploitable bloquante. Le constat 2 (échec distant masqué) est à corriger avant
le premier déploiement réel.

## Commandes exécutées

| Contrôle | Résultat |
|---|---|
| `gitleaks dir` sur le worktree (Docker, `--redact`) | 2 trouvailles, `curl-auth-user`, `docs/DEPLOIEMENT.md:210` et `:477` |
| `gitleaks git --log-opts=origin/dev..deploy/alwaysdata-vercel` (dépôt principal, même `.gitleaksignore` que la CI) | 2 trouvailles, empreintes `430d128...:docs/DEPLOIEMENT.md:curl-auth-user:208` et `:475`, non ignorées |
| `gitleaks git --log-opts=--all` | 3 trouvailles : les 2 ci-dessus + `5f458c0` (connue, lot 1) |
| `npm audit --omit=dev --audit-level=high` | backend : code 0 (15 low/moderate) ; frontend : code 0 (23 low/moderate) |
| Auteurs du lot | 8 commits, auteur et committer `Mvth1s`, adresse `m***@p***` (alias personnel déjà connu, pas l'adresse noreply) |
| Adresses mail ajoutées par le diff | aucune |

## Constats

| # | Constat | Fichier:ligne | Gravité | Correction attendue | Agent |
|---|---|---|---|---|---|
| 1 | gitleaks (règle `curl-auth-user`) détecte deux exemples `curl --basic -u "<jeton> account=<compte>:"` introduits par `430d128`. Faux positifs, mais le job CI `secrets-scan` (`--exit-code 1` sur `BASE..HEAD`) échouera sur la PR. | `docs/DEPLOIEMENT.md:210`, `:477` (commit `430d128`, lignes 208 et 475) | bloquant | Ajouter les deux empreintes `430d128df18d7dec0ec483caeebcf39ca924eaab:docs/DEPLOIEMENT.md:curl-auth-user:208` et `:475` à `.gitleaksignore`, avec commentaire ; reformuler les exemples pour ne plus déclencher la règle (ex. `-K -` comme le workflow). Mettre à jour `docs/SECURITE.md` ligne 119 ("une seule exception") | deploiement (`.gitleaksignore`), docs-keeper (DEPLOIEMENT.md), gardien-securite-doc |
| 2 | Le step "Migrate, grant, bootstrap and switch" n'a ni `shell: bash` ni `set -o pipefail` : GitHub exécute alors `bash -e {0}` sans pipefail, et le statut de `... \| ssh ... 'bash -s' \| tee remote.log` est celui de `tee`. Un échec distant (migration, **`grants.sql`**, bootstrap, version de Node) est masqué : le lien `current` n'est pas basculé, le site redémarre sur l'ancienne release, `/health` répond, le workflow est vert. Un `grants.sql` en échec (droits de `_app` non restaurés, H3) passerait inaperçu. | `.github/workflows/deploy-backend.yml:227`, `:308` | important | Ajouter `shell: bash` au step (ou `defaults.run.shell: bash` au job, qui active `-eo pipefail`), ou `set -o pipefail` en tête du `run` | deploiement |
| 3 | Le port 3333 du backend est désormais lié à `127.0.0.1` pour que `/api` (sans `API_KEY` en local) ne soit pas joignable du réseau local, mais le frontend reste publié sur toutes les interfaces et son proxy relaie `/api/**` sans Basic Auth ni clé en local : l'objectif de `7f1b4d0` est contourné par le port 3000. | `docker-compose.yml:116` | important | Lier aussi le frontend : `'127.0.0.1:3000:3000'` (ou documenter l'exposition LAN comme choix assumé) | deploiement |
| 4 | `actions/checkout` sans `persist-credentials: false` : le `GITHUB_TOKEN` (lecture seule) reste dans `.git/config` pendant `npm ci` et `node ace build`. Non envoyé au serveur (rsync de `backend/build/` seulement). | `.github/workflows/deploy-backend.yml:130` | mineur | `with: persist-credentials: false` | deploiement |
| 5 | Isolation des secrets par step partielle : un script `postinstall` exécuté par `npm ci` peut écrire dans `$GITHUB_ENV` / `$GITHUB_PATH` et influencer les steps suivants qui, eux, reçoivent les secrets. La mesure "jamais à npm ci" est exacte mais ne protège pas contre une dépendance compromise. | `.github/workflows/deploy-backend.yml:147-153` | mineur | Accepté en l'état (lockfile, `npm audit`, Dependabot) ; piste : build dans un job séparé sans environnement `production`, artefact transmis au job de déploiement | deploiement |
| 6 | Sur le serveur, les secrets `_owner` et `APP_OWNER_PASSWORD` vivent dans l'environnement des process (`/proc/<pid>/environ`) le temps du déploiement, lisibles par le même utilisateur Unix que le site. Jamais écrits sur disque ni en argument (vérifié). | `.github/workflows/deploy-backend.yml:239-288` | mineur | Accepté (même compte alwaysdata, fenêtre courte) ; à mentionner dans `docs/SECURITE.md` 2.6 | gardien-securite-doc |
| 7 | Proxy Nitro : `readRawBody` sans limite de taille (Vercel plafonne à 4,5 Mo, rien en Docker) ; `fetch` sans délai (déjà listé en amélioration future). Le backend refuse au-delà de 100 ko. | `frontend/server/api/[...path].ts:51`, `:55` | mineur | Refuser tôt au-delà de ~100 ko (`content-length`) ; `AbortSignal.timeout(...)` | frontend-nuxt |
| 8 | `GET /` du backend répond `{ hello: 'world' }` sans clé (préexistant). Aucune donnée, mais signature de framework pour les scanners. | `backend/start/routes.ts:12` | mineur | Supprimer la route ou la placer sous la clé | backend-adonisjs |
| 9 | `grants.sql` donne le DML à `_app` sur **toutes** les tables du schéma, y compris `adonis_schema` et `adonis_schema_versions` (suivi des migrations). Préexistant. | `backend/database/sql/grants.sql:28`, `:37` | mineur | `REVOKE INSERT, UPDATE, DELETE ON adonis_schema, adonis_schema_versions FROM :"app_role"` après les GRANT | backend-adonisjs |
| 10 | `docs/SECURITE.md` 2.4 "Ports locaux" ne cite que PostgreSQL et Adminer ; le backend est aussi lié à `127.0.0.1` depuis `7f1b4d0`, le frontend ne l'est pas (constat 3). | `docs/SECURITE.md:110` | mineur | Mettre à jour la ligne après correction du constat 3 | gardien-securite-doc |
| 11 | Adresse de commit `m***@p***` (alias personnel) sur les 8 commits du lot. Déjà connu et assumé (`docs/SECURITE.md` 2.2). | `05b0eac`..`dbee8ce` | mineur (hors lot) | Adresse noreply GitHub dans `user.email` | Mvth1s |

## Points contrôlés conformes

**Secrets**
- Aucune valeur en dur dans le diff (code, compose, workflow, seeders, doc) ; les tests génèrent la clé avec `randomBytes`.
- `.env.example` racine : `API_KEY`, `NUXT_BASIC_AUTH_*` vides et justifiés (facultatifs en dev, obligatoires en prod). `backend/.env.example` : nouvelles variables commentées avec marqueurs `<a-generer: ...>`. `frontend/.env.example` : aucune valeur secrète.
- Échec au démarrage en production, backend : `API_KEY` obligatoire (32 car. min.) via `productionSecret`, marqueurs `<` refusés, `APP_KEY`, `DB_PASSWORD` obligatoires (`backend/start/env.ts:213-236`, `289`).
- Échec au démarrage en production, Nitro : `check-env.ts` lève si `basicAuthUser`, `basicAuthPassword`, `apiKey` ou `apiUpstream` est vide ou commence par `<` ; seuls les noms sont cités.

**Workflow de déploiement**
- Secrets limités aux steps qui les utilisent ; aucun secret pour `npm ci` / build.
- Aucun secret en argument : exports générés par `printf` (builtin) sur l'entrée standard de `bash -s`, `curl -K -` pour le jeton API, `PGPASSWORD` en environnement ; aucun `set -x`, aucun `echo` de valeur ; clés jetables masquées (`::add-mask::`).
- Mot de passe `_owner` jamais écrit sur l'hôte (ni fichier, ni argument, `main </dev/null`).
- `known_hosts` obligatoire (le step de contrôle l'exige), `StrictHostKeyChecking yes`, `BatchMode yes`, clé en 600 sous `RUNNER_TEMP`, supprimée en `if: always()`.
- `permissions: contents: read`, actions épinglées par SHA (identiques à `ci.yml`), `environment: production`, `concurrency` sans annulation, entrées réutilisées dans des commandes validées par regex.
- Restriction de l'environnement à `main` documentée (`docs/DEPLOIEMENT.md` 6.1 ; **non vérifiable dans le dépôt**).

**Exposition HTTP**
- En-têtes de production (HSTS, nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy, X-Robots-Tag, CSP avec `frame-ancestors 'none'`, `object-src 'none'`) ; `'unsafe-inline'` assumé (H12).
- Basic Auth et `X-Api-Key` comparées à temps constant (SHA-256 + `timingSafeEqual`, sans court-circuit pour la Basic Auth).
- Proxy : liste blanche d'en-têtes entrants (`Authorization`, `Cookie`, `Host` jamais relayés), seul `content-type` renvoyé au client, segments décodés puis ré-encodés, `.`/`..` refusés (400), `redirect: 'manual'`, 502 générique.
- 500 génériques en production (`handler.ts`), CORS vide en production avec `credentials: false`, corps limités à 100 ko et multipart désactivé, redaction des logs (`authorization`, `cookie`, `x-api-key`, `password`), `/health` sans détail.

**Moindre privilège BDD**
- `grants.sql` rejoué en `_owner` après `migration:run`, à chaque déploiement (`deploy-backend.yml:278-284`) ; copié dans le build.
- Site documenté sur `_app` (`docs/DEPLOIEMENT.md:173`, "Jamais `_owner`") ; variables `_owner` et `APP_OWNER_*` explicitement interdites sur le site. **Non vérifiable dans le dépôt.**

## Exactitude de `docs/SECURITE.md`

Chaque mesure "en place" des sections 2.1 à 2.5 a été retrouvée dans le fichier cité. Écarts :
- ligne 119 : "une seule exception" dans `.gitleaksignore`, à corriger avec le constat 1 ;
- ligne 110 : ports locaux incomplets (constat 10) ;
- section 2.6 : ajouter l'exposition des secrets dans l'environnement des process distants (constat 6) et, si non corrigé, le constat 5.

## Non vérifié

- Correspondance des SHA d'actions avec leurs tags (pas d'accès réseau autorisé ; mêmes SHA que `ci.yml`, déjà audités).
- Réglages de plateforme : environnement GitHub, variables alwaysdata et Vercel, droits réels de `_app` en production.
- Comportement réel des en-têtes `routeRules` sur les réponses du proxy et du CDN Vercel (lecture de code seulement).
