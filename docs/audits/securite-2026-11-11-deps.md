# Audit de sécurité - mises à jour de dépendances (2026-11-11)

Périmètre : branche `chore/deps-2026-11` (HEAD `94a5d2c`), plage `dev...HEAD` (3 commits :
`399f8a3`, `f2b5048`, `94a5d2c`). Fichiers touchés : `.github/workflows/ci.yml`,
`.github/workflows/deploy-backend.yml`, `CHANGELOG.md`, `backend/package.json`,
`backend/package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`,
`frontend/.nuxtrc`. Référentiel : `docs/SECURITE.md`. Audit en lecture seule.

## En tête : secret dans l'historique

Aucun secret réel trouvé. gitleaks ne relève rien sur la plage (3 commits) ni sur `--all`
(125 commits).

## Verdict

**Non bloquant.** Aucun constat bloquant ni important. Restent des remarques mineures et
informatives.

## Constats

| # | Constat | Fichier:ligne | Gravité | Correction attendue | Agent |
|---|---|---|---|---|---|
| M1 | Les 3 commits de la plage ont pour auteur et committer `Mvth1s` avec l'adresse personnelle `m***@p***` (déjà relevé en M2 de l'audit final 0.1.1, recommandation non encore appliquée). Le nom affiché est bien le pseudo | `399f8a3`, `f2b5048`, `94a5d2c` | Mineur (accepté) | Aucune réécriture. Pour la suite : `user.email` local sur l'adresse noreply GitHub | Mvth1s (hors agents) |
| M2 | La correspondance SHA / tag des nouveaux épinglages (`actions/checkout@3d3c42e…` = v7.0.1, `actions/setup-node@949feb2…` = v7.1.0) n'a pas pu être confirmée : `git ls-remote` et l'API GitHub sont hors des outils de l'auditeur. Les SHA ont bien 40 caractères | `.github/workflows/ci.yml:32`, `deploy-backend.yml:141,146` | Mineur | Vérifier avant fusion : `git ls-remote --tags https://github.com/actions/checkout v7.0.1` et idem `actions/setup-node v7.1.0` (pour un tag annoté, comparer avec la ligne `^{}`) | Mvth1s ou `deploiement` |
| M3 | `npm audit --omit=dev` : aucune faille high ni critical. Modérées et faibles inchangées par rapport à l'audit final 0.1.1 (backend 14 modérées, 1 faible ; frontend 21 modérées, 2 faibles) | `backend/package-lock.json`, `frontend/package-lock.json` | Mineur | Aucune (sous le seuil) ; suivre via Dependabot | décision Mvth1s |
| I1 | Versions publiées il y a moins de 14 jours (toutes en devDependencies frontend, absentes du runtime de production) : `@nuxt/test-utils` 4.4.0 (2026-11-08, 3 j), `fake-indexeddb` 6.2.8 (2026-11-08, 3 j), `vitest`, `@vitest/mocker`, `@vitest/spy` 5.1.0 (2026-11-02, 9 j), `tinybench` 6.2.3 (2026-11-01, 10 j). Toutes les autres versions nouvelles ont plus de 14 jours (`pg` 8.23.1 et sous-paquets `pg-*` : 2026-09-30 ; `@types/luxon` 3.7.6 : 2026-09-29 ; `typescript` 6.0.3 : 2026-04-16 ; `@clack/*`, `obug` : 2026-09 ; `why-is-node-running` 3.2.1 : 2024-10) | `frontend/package-lock.json` | Info | Aucune ; à garder en tête si un incident de chaîne d'approvisionnement est annoncé sur ces paquets | - |
| I2 | Seule nouvelle entrée du lockfile frontend : `vitest/node_modules/obug` 3.0.0 ; le reste est des montées de version ou des retraits (sous-dépendances de vitest 4 et de `@nuxt/test-utils` 4.1). Aucun `hasInstallScript` ajouté. Lockfile backend : uniquement des montées de version (`pg`, `pg-protocol`, `pg-cloudflare`, `pg-connection-string`, `@types/luxon`, `typescript`) | `backend/package-lock.json`, `frontend/package-lock.json` | Info | Aucune | - |
| I3 | `frontend/.nuxtrc` : seule la version mémorisée de `@nuxt/test-utils` change (4.1.0 -> 4.4.0), fichier généré par l'outil | `frontend/.nuxtrc:1` | Info | Aucune | - |

## Points contrôlés

| Point du socle | Statut | Preuve |
|---|---|---|
| gitleaks, plage `dev..HEAD` | OK | 3 commits scannés, aucune fuite |
| gitleaks, `--all` | OK | 125 commits scannés, aucune fuite |
| `npm audit --omit=dev --audit-level=high` backend | OK | Code de sortie 0 (M3) |
| `npm audit --omit=dev --audit-level=high` frontend | OK | Code de sortie 0 (M3) |
| Provenance des paquets | OK | Les 534 (backend) et 878 (frontend) champs `resolved` pointent tous vers `https://registry.npmjs.org/` ; toutes les lignes `integrity` ajoutées sont en `sha512-` |
| Dépendances de production | OK | Seul `pg` (8.23.0 -> 8.23.1, correctif) change côté runtime backend ; aucune dépendance de production ajoutée côté frontend |
| Actions épinglées par SHA complet | OK | Tous les `uses:` des deux workflows ont un SHA de 40 caractères suivi du tag en commentaire (M2 pour la correspondance) |
| `permissions:` minimales | OK, inchangées | `contents: read` en tête de `ci.yml:8-9` et `deploy-backend.yml:60-61` ; le diff des workflows ne contient que les lignes `uses:` |
| `persist-credentials: false` | OK, conservé | 9 `actions/checkout` dans `ci.yml`, 9 `persist-credentials: false` (plus le commentaire ligne 18) ; 1 sur 1 dans `deploy-backend.yml:143` |
| Secrets dans le diff | OK | Aucune chaîne de type mot de passe, jeton, clé ou adresse mail ajoutée |
| Données personnelles | OK (voir M1) | Nom réel : 0 occurrence dans le diff et les messages de commit (recherche sur liste de mots tirée des identités Git, fichier temporaire supprimé) ; seul le pseudo `Mvth1s` apparaît |
| `CHANGELOG.md` | OK | Ajout factuel sous `[Unreleased]`, aucune donnée sensible |
| Non vérifiable dans le dépôt | - | Correspondance SHA / tag des actions (M2), protection de branche, résultat de la CI GitHub sur la branche |

## Méthode

`docker run zricethezav/gitleaks:latest git` (plage et `--all`, `--redact`) ; `npm audit
--omit=dev --audit-level=high` puis `--json` dans `backend/` et `frontend/` ; `npm view <pkg>
time` pour chaque version nouvelle du lockfile ; `git diff dev...HEAD`, `git log dev..HEAD` ;
`grep` sur les workflows et les lockfiles.
