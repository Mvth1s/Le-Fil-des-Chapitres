# Audit de sécurité final - release 0.1.0 (2026-11-11)

Périmètre : branche `chore/release-0.1.0` (HEAD `53456a5`, identique à
`origin/chore/release-0.1.0`), arbre courant et historique `origin/main..chore/release-0.1.0`
(`origin/main` = `c7c3944`). Référentiel : `docs/SECURITE.md`. Audit en lecture seule.

## En tête : secret dans l'historique

Aucun secret réel de production trouvé.

Une seule trouvaille gitleaks non couverte par `.gitleaksignore` : `APP_KEY` fixe de l'ancienne
CI, `.github/workflows/ci.yml:92`, commit `5f458c0` (déjà connue, audit lot 1, retirée en
`9ca5d62`). Valeur non recopiée. **Contrairement à l'hypothèse de départ, ce commit est DANS la
plage `origin/main..chore/release-0.1.0`** : `main` n'a jamais reçu l'historique de `dev`
(`git merge-base --is-ancestor 5f458c0 origin/main` est faux). Voir B1.

## Verdict

**1 écart bloquant : B1.** Le socle lui-même (code, config, workflows) est conforme. B1 bloque
le merge de la PR de release vers `main`, car le job CI `secrets-scan` échouera.

## Constats

| # | Constat | Fichier:ligne | Gravité | Correction attendue | Agent |
|---|---|---|---|---|---|
| B1 | Le job `secrets-scan` scanne `base.sha..head.sha`. Pour la PR vers `main`, la plage inclut `5f458c0` (`generic-api-key`), absent de `.gitleaksignore`. Reproduit en local avec le `.gitleaksignore` de la branche : 1 trouvaille, exit 1. Les PR vers `dev` passaient parce que `dev` contenait déjà ce commit. | `.gitleaksignore` (entrée absente) ; `.github/workflows/ci.yml:77-78` | Bloquant | Ajouter, avec un commentaire (clé fixe d'une CI éphémère, aucune donnée réelle, retirée en `9ca5d62`), l'empreinte `5f458c02982c79b5fa5d294e8b5fe116e0325da8:.github/workflows/ci.yml:generic-api-key:92`. Vérifier aussi (hors dépôt) que cette valeur n'a jamais été reprise comme `APP_KEY` en local ou en production ; sinon, la faire tourner. | `deploiement` (fichier racine lié à la CI ; à confirmer par l'orchestrateur, `.gitleaksignore` n'est dans aucun périmètre explicite) |
| M1 | `docs/SECURITE.md` 2.5 "Faux positifs tracés" ne décrit que des exemples curl. Ce n'est plus exact une fois B1 corrigé. | `docs/SECURITE.md:119` | Mineur | Mentionner l'exception historique de la CI (`5f458c0`) | `gardien-securite-doc` |
| M2 | `npm audit --omit=dev` : aucune faille high ni critical (exit 0 pour le backend et le frontend). Restent des failles modérées dans les dépendances de production : `deepmerge` (GHSA-gcqx-w48m-w2h4, par `@adonisjs/lucid` et `nitropack`), `minimatch`, `glob`. Backend : 14 modérées et 1 faible. Frontend : 21 modérées et 2 faibles. Les correctifs proposés sont des retours de version majeure. | `backend/package-lock.json`, `frontend/package-lock.json` | Mineur | Aucune action en 0.1.0 (sous le seuil du socle) ; suivre via Dependabot | décision Mvth1s |
| I1 | `gitleaks dir` relève 5 trouvailles dans l'arbre : 4 dans `.env` (non versionné, ignoré par `.gitignore:27`, non lu par l'auditeur, valeurs masquées) et 1 dans `frontend/.nuxt/dev/index.mjs:726` (artefact de dev généré, ignoré par `frontend/.gitignore:4`). Aucun fichier versionné touché. | - | Info | Aucune | - |
| I2 | Une adresse noreply GitHub partiellement masquée (préfixe numérique tronqué + pseudo) figure dans un ancien rapport d'audit. C'est une adresse liée au pseudo, pas une donnée personnelle. | `docs/audits/securite-2026-11-10-lot1.md:45` | Info | Aucune | - |

## Points contrôlés

| Point du socle | Statut | Preuve |
|---|---|---|
| gitleaks, arbre courant (`dir`) | OK | Seuls des fichiers ignorés sont touchés (I1) |
| gitleaks, plage `origin/main..chore/release-0.1.0` avec `.gitleaksignore` | **KO** (B1) | 81 commits, 1 trouvaille : `5f458c0` |
| gitleaks, `--all` | Même trouvaille seulement | `430d128` (x2) couverts par le `.gitleaksignore` de la branche ; `bc15dbc` couvert |
| `.env` ignoré et non versionné | OK | `git check-ignore` : `.gitignore:27` ; `git ls-files` ne montre que des `.env.example` |
| Valeurs en dur (code, compose, workflows, seeders, doc) | OK | Aucune affectation littérale de secret ni chaîne de connexion. Les `.env.example` ne contiennent que des marqueurs `<...>` ou des valeurs vides. `user_seeder.ts` génère un mot de passe aléatoire |
| Données personnelles (arbre courant) | OK | Nom réel du profil : 0 occurrence. Adresses personnelles : 0. `LICENSE` au nom de `Mvth1s`. Pas de champ `author` dans les `package.json`. Métadonnées des images de `logo/` et `frontend/public` : aucune occurrence. Historique : 20 merges GitHub portent le nom réel (`M***** A*****`) et des commits portent des adresses `m***@p***` / `a***@g***`, un point déjà connu et non réécrit par décision |
| Trois comptes PostgreSQL et grants | OK | `docker/postgres/init/01-roles.sh` (rôles, `REVOKE CREATE`, marqueurs refusés). `backend/database/sql/grants.sql` (DML pour `_app`, SELECT pour `_ro`, default privileges, sans mot de passe). `config/database.ts` (connexion `migration` séparée). Les tests CI tournent en `lfdc_app`. Le déploiement rejoue `grants.sql` en `_owner` |
| Clé `X-Api-Key` | OK | `api_key_middleware.ts` (comparaison à temps constant sur SHA-256), `routes.ts:52` sur tout `/api`, `env.ts:94` (obligatoire en prod, 32 caractères minimum) |
| `/health` public et minimal | OK | `routes.ts:23-31` (`ok` / `error`, détail uniquement dans les logs) |
| Proxy Nitro | OK | `frontend/server/api/[...path].ts` : liste blanche d'en-têtes, `.`/`..` refusés, `redirect: 'manual'`, timeout de 10 s (504), 413 à 100 ko, 502 générique |
| Basic Auth | OK | `server/middleware/basic-auth.ts` : `timingSafeEqual` sur SHA-256, les deux comparaisons toujours exécutées |
| Garde-fou env frontend | OK | `server/plugins/check-env.ts` (4 clés, marqueurs refusés, noms seuls) |
| En-têtes et CSP | OK | `nuxt.config.ts:37-63` (HSTS, nosniff, Referrer-Policy, XFO DENY, Permissions-Policy, X-Robots-Tag, CSP avec `frame-ancestors 'none'`, `object-src 'none'`, `connect-src 'self'`). `'unsafe-inline'` est un écart assumé (H12) |
| Liens externes | OK | `url_options.ts` (http/https seulement), `AppButton.vue:32` (`noopener noreferrer`), aucun `v-html` |
| CORS | OK | `config/cors.ts` (liste `CORS_ORIGINS`, vide par défaut, `credentials: false`) |
| Handler d'erreurs | OK | `exceptions/handler.ts:22-25` (5xx générique hors debug) |
| Limites de corps | OK | `config/bodyparser.ts` (100 ko, multipart désactivé) |
| Logs | OK | `config/logger.ts:22-33` (redaction de authorization, cookie, x-api-key, password) |
| Ports locaux | OK | `docker-compose.yml` : les 4 ports sont liés à `127.0.0.1` |
| `npm audit --omit=dev --audit-level=high` | OK | Backend et frontend : exit 0 (M2) |
| Dependabot | OK | `.github/dependabot.yml` : npm backend, npm frontend et github-actions, hebdomadaire, 5 PR maximum |
| Actions épinglées par SHA | OK | Tous les `uses:` des deux workflows ont un SHA de 40 caractères |
| `permissions:` minimales | OK | `contents: read` dans les deux workflows ; `persist-credentials: false` sur chaque checkout |
| gitleaks en CI | OK sur le principe | Binaire 8.30.1 vérifié par SHA-256, `--redact`, `--exit-code 1` (mais B1) |
| Workflow de déploiement | OK | `environment: production`, secrets limités aux steps qui en ont besoin, `npm ci` sans secret, entrées validées par regex, `printf %q` et `bash -s` sur stdin, `curl -K -`, known_hosts et `StrictHostKeyChecking yes`, `BatchMode`, `pipefail`, `concurrency` sans annulation, release de repli préservée, matériel SSH supprimé (`if: always()`) |
| Exactitude de `docs/SECURITE.md` | OK sauf M1 | Chaque mesure "en place" a été retrouvée dans le fichier cité |
| Exactitude de `docs/DEPLOIEMENT.md` | OK | 16 secrets et 1 variable, identiques à `deploy-backend.yml:107-111`. Les 9 checks cités correspondent aux jobs de `ci.yml`. `frontend/vercel.json` fixe bien `cdg1`. Les variables du site sont cohérentes avec `start/env.ts` |
| Non vérifiable dans le dépôt | - | Protection de branche, environnement GitHub `production`, variables alwaysdata/Vercel, profil API restreint, rôles PostgreSQL de production |

## Méthode

`docker run zricethezav/gitleaks:latest` en modes `dir` (worktree) et `git` (dépôt principal),
avec `--redact` et `--gitleaks-ignore-path` pointant sur le `.gitleaksignore` de la branche.
Le `.gitleaksignore` du dépôt principal (branche `dev`) ne contient pas les entrées `430d128`.
Ensuite : `npm audit` dans `backend/` et `frontend/`, `git grep` et `git log`. Les rapports
JSON temporaires de gitleaks ont été supprimés.
