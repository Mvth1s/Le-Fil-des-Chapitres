# Audit securite - lot 2 - 2026-11-11

Agent : `auditeur-securite`. Branche : `fix/security-baseline-secrets` (HEAD `9ca5d62`),
diff `git diff dev...HEAD` (5 commits : 40d1f89 17a4658 dde00ac ebdfabf 9ca5d62).
Lecture seule. Points audites : 3.1, 3.2 (arbre courant), 3.3 partie locale, 3.5.
Hors perimetre (lot 6) : CORS, en-tetes HTTP, handler d'erreurs, proxy Nitro, X-Api-Key.
Contenu des `.env` non versionnes non lu.

## En tete : secret reel trouve

**Non.**

- `gitleaks git --log-opts="dev..fix/security-baseline-secrets" --redact` (v8.30.1, image
  Docker) : 5 commits scannes, **aucune fuite**. La cle `APP_KEY` CI signalee au lot 1 est
  retiree de l'arbre (elle reste dans l'historique de `dev`, sans valeur reelle, voir lot 1).
- `gitleaks dir` (equivalent `--no-git`) sur l'arbre de travail, `--redact` : 1 trouvaille,
  **faux positif** : regle `curl-auth-user`, `docs/release-0.1.0.md:72` (fichier non suivi),
  exemple de la doc officielle alwaysdata avec un marqueur `APIKEY account=[account]:`, aucune
  valeur reelle.

## Verdict

**Non bloquant pour la PR.** Aucun constat bloquant. Deux constats importants a traiter
avant la release (lot 3 et lot 6), le reste est mineur.

## Constats

| # | Constat | Fichier:ligne | Gravite | Correction attendue | Agent |
|---|---|---|---|---|---|
| 1 | Prenom reel encore present dans l'arbre suivi (masque `M*****`). Non corrige dans ce lot car `CLAUDE.md` interdit de modifier `roadmap.md` sans demande explicite. | `roadmap.md:55` | important | Remplacer par `Mvth1s` apres accord explicite de Mvth1s (lot 3). | docs-keeper |
| 2 | Ecart a la lettre de 3.1 : la CI ne lit pas `CI_APP_KEY` / `CI_DB_PASSWORD` dans GitHub Secrets mais genere ses secrets a chaque run. Jugee acceptable (voir section dediee), mais l'ecart doit etre consigne. | `.github/workflows/ci.yml:136-148` | important | Documenter la decision dans `docs/SECURITE.md` (et `docs/DEPLOIEMENT.md` qui devait lister ces secrets). Ne pas creer les deux GitHub Secrets. | docs-keeper |
| 3 | Les marqueurs des `.env.example` sont des chaines non vides de plus de 16 caracteres : copies sans etre remplaces, ils passent `${VAR:?}` de compose, `01-roles.sh` et la validation `APP_KEY` de `start/env.ts`. La base locale serait creee avec des mots de passe publics. | `.env.example:20-31`, `backend/.env.example:13,22,27`, `backend/start/env.ts:23-29`, `docker/postgres/init/01-roles.sh:26-28` | mineur | Rejeter toute valeur commencant par `<` (ou contenant `a-generer`/`a-recopier`) dans `start/env.ts` et dans `01-roles.sh`. | backend-adonisjs (env.ts), deploiement (01-roles.sh) |
| 4 | Ports Postgres et Adminer publies sur toutes les interfaces : la base locale est joignable depuis le reseau local (aggrave le constat 3). | `docker-compose.yml:25,114` | mineur | Lier a `127.0.0.1:5432:5432` et `127.0.0.1:8080:8080`. | deploiement |
| 5 | Le conteneur backend de dev recoit aussi `DB_MIGRATION_PASSWORD` (`_owner`) pendant `node ace serve`. La connexion par defaut reste `_app`, donc le modele de droits est respecte ; c'est seulement une exposition locale. En production, 3.3 interdit ce cas. | `docker-compose.yml:72-75` | mineur | Acceptable en local. En lot 6, verifier que le site alwaysdata ne recoit jamais `DB_MIGRATION_*`. | deploiement (lot 6) |
| 6 | `DB_MIGRATION_USER` / `DB_MIGRATION_PASSWORD` optionnels : `migration:run --connection=migration` sans ces variables echoue sur une erreur d'authentification Postgres, pas sur un message clair. | `backend/start/env.ts:50-51` | mineur | Optionnel : verification explicite dans `config/database.ts` quand la connexion `migration` est utilisee. | backend-adonisjs |
| 7 | Chaque variable n'est pas commentee individuellement (`TZ`, `PORT`, `HOST`, `LOG_LEVEL`, `NODE_ENV`, `DB_PORT`, `DB_DATABASE`). Valeurs non secretes. | `backend/.env.example:8-12,17-18` | mineur | Ajouter une ligne de commentaire par variable ou par groupe. | backend-adonisjs |
| 8 | README obsolete : `DB_USER=lfdc`, `DB_PASSWORD=votre_mot_de_passe`, `APP_KEY=votre_clé_secrète`, instructions qui ne correspondent plus au `.env` racine ni aux trois roles. Aucune valeur utilisable, mais incoherent avec 3.1. | `README.md:80-90` | mineur | Aligner sur `.env.example` (marqueurs, trois roles, `down -v` requis si volume cree avant ce lot). | docs-keeper |
| 9 | SHA des actions (`actions/checkout@fbc6f39...` v5.1.0, `actions/setup-node@a0853c2...` v5.0.0) et somme SHA-256 de gitleaks 8.30.1 non verifies en ligne (outils de l'auditeur limites). Un SHA provenant d'un fork serait quand meme resolu par GitHub. | `.github/workflows/ci.yml:30,56,82` | mineur | Verifier par `gh api repos/actions/checkout/git/ref/tags/v5.1.0` (idem setup-node) et contre le fichier `checksums.txt` de la release gitleaks. Une somme fausse fait echouer le job (sans risque). | orchestrateur |
| 10 | Images Docker epinglees par tag (`postgres:16`, `adminer:4`), pas par digest. 3.5 ne vise que les actions. | `docker-compose.yml:13,111`, `.github/workflows/ci.yml` (step Start Postgres) | mineur | Ameliorations futures dans `docs/SECURITE.md`. | docs-keeper |
| 11 | Identite des 5 commits de la branche : `Mvth1s` avec l'alias `+github` de la boite admise (masque `m***@p***`), pas l'adresse `+lfdc` de 3.2. Meme ecart de convention qu'au lot 1, aucune fuite. | commits 40d1f89..9ca5d62 | mineur | Optionnel : `git config user.email` sur l'adresse admise. | Mvth1s |
| 12 | `npm audit` complet (dev inclus) : 1 `high` dans le frontend (`happy-dom` <= 21.0.3, dependance de test). Hors critere `--omit=dev`. | `frontend/package-lock.json` | mineur | Laisser Dependabot proposer la mise a jour. | frontend-nuxt |

## Statut des points du socle

### 3.1 Secrets

| Point | Statut | Preuve |
|---|---|---|
| Zero valeur en dur dans code, workflows, compose, seeders, doc | conforme | `git grep -w changeme` : seules occurrences dans le prompt de mission (description de l'etat initial). CI : `APP_KEY` et `changeme` retires (`ci.yml`). Compose : tous les secrets en `${VAR:?...}` (`docker-compose.yml:13-17,55,62,65`). Seeder : mot de passe aleatoire `randomBytes(32)` jamais affiche, seul le hash est stocke (`user_seeder.ts:21-22`). `grants.sql` ne contient aucun mot de passe. Reste README (constat 8, sans valeur utilisable). |
| `.env.example` : marqueurs uniquement, variables commentees | conforme (reserve mineure) | Racine et frontend : conformes. Backend : marqueurs `<a-recopier ...>`, commentaires par groupe (constat 7). `.env` et `.env.*` ignores, `!.env.example` (`.gitignore:27-29`), aucun `.env` suivi. |
| Demarrage echoue si secret obligatoire absent | conforme | Compose : `${VAR:?}` sur les 5 secrets. `01-roles.sh:26-28` : `:?` sur les 3 mots de passe. `start/env.ts` : `APP_KEY` obligatoire et >= 16 caracteres, `DB_PASSWORD` passe d'optionnel a obligatoire. Limite : un marqueur non remplace passe (constat 3). Verification Nitro au boot : lot 6. |
| gitleaks en CI | conforme | Job `secrets-scan` sur toute PR, binaire officiel MIT verifie par SHA-256, `--redact`, `--exit-code 1`, plage `base..head` de la PR (`ci.yml:52-74`). Pas de `gitleaks-action` (licence EULA evitee). |
| Secrets CI via GitHub Secrets | ecart accepte | Voir section suivante. |

### Decision CI : secrets aleatoires a chaque run

**Acceptable, et preferable a des GitHub Secrets pour ce cas.** Raisons :

- La base CI est un conteneur jetable sans donnee reelle : le secret n'a de valeur que
  pendant le run, rien a stocker, rien a faire tourner, rien qui puisse fuiter durablement.
- Les PR venant d'un fork n'ont pas acces aux GitHub Secrets : avec `CI_APP_KEY` le job
  echouerait pour elles, la generation fonctionne partout.
- Valeurs issues de `openssl rand -hex`, masquees par `::add-mask::` avant ecriture dans
  `GITHUB_ENV` (`ci.yml:141-143`), passees a `docker run` par `-e VAR` sans valeur (pas sur la
  ligne de commande), lues dans le conteneur via `sh -c '...$DB_APP_PASSWORD...'`.
- Exposition residuelle identique a celle des GitHub Secrets : les valeurs sont dans
  l'environnement des steps suivants (dont `npm ci` et ses scripts d'installation), et un
  eventuel `docker logs postgres` en echec reste masque par GitHub.

Condition : consigner l'ecart (constat 2). Les secrets de **deploiement** (lot 6) doivent
eux rester dans un environnement GitHub `production` restreint a `main`, la decision ne
s'etend pas a eux.

### 3.2 Donnees personnelles (arbre courant)

| Point | Statut | Preuve |
|---|---|---|
| Seul le pseudo `Mvth1s` dans l'arbre | partiel | Corriges dans ce lot : `user_seeder.ts` (username `mvth1s`), `AppButton.vue`, maquette (commit dde00ac). Reste `roadmap.md:55` (constat 1). `git grep -i` sur le prenom, fichiers suivis et non suivis, hors lockfiles : 1 seule occurrence. |
| Adresses mail dans l'arbre | conforme | Seule adresse trouvee (hors lockfiles, scopes npm, `noreply`) : l'adresse de contact admise, dans le prompt de mission non suivi. |
| Auteurs des commits de la branche | conforme (ecart mineur) | 5 commits, auteur et committer `Mvth1s`, alias de la boite admise (constat 11). Historique anterieur : voir lot 1, non reaudite. |

### 3.3 Base de donnees, partie locale

| Point | Statut | Preuve |
|---|---|---|
| Trois roles `_owner` / `_app` / `_ro`, mots de passe distincts | conforme | `docker/postgres/init/01-roles.sh:44-57` cree `lfdc_owner`, `lfdc_app`, `lfdc_ro` avec trois variables distinctes ; superuser `postgres` reserve a l'init. Mots de passe passes par `psql -v` puis `format(... %L, :'var')` : pas d'injection shell ou SQL. Base creee `OWNER lfdc_owner`, schema `public` donne a `lfdc_owner`, `REVOKE CREATE ... FROM PUBLIC` (`01-roles.sh:62-65`). |
| Droits : `_app` DML + sequences, aucun DDL ; `_ro` SELECT | conforme | `backend/database/sql/grants.sql:22-44`. `ALTER DEFAULT PRIVILEGES` execute en `lfdc_owner`, donc applique aux tables futures des migrations. |
| `grants.sql` idempotent | conforme | Uniquement des `GRANT` et `ALTER DEFAULT PRIVILEGES ... GRANT`, sans effet si deja accordes ; aucun `CREATE ROLE`, aucun mot de passe ; noms de roles en variables psql. Le bloc roles de `01-roles.sh` est lui aussi rejouable (`WHERE NOT EXISTS` + `\gexec`). |
| Backend sur `_app`, migrations sur `_owner` | conforme | Connexion par defaut `DB_*` = `lfdc_app`, connexion `migration` = `DB_MIGRATION_*` (`backend/config/database.ts:21-44`). Compose : migrations en `--connection=migration`, seed et serveur sur la connexion par defaut (`docker-compose.yml:72-75`). |
| CI sur `_app` | conforme | Memes scripts d'init montes dans le conteneur Postgres CI ; `DB_USER: lfdc_app`, migrations en `--connection=migration`, `db:seed` et `node ace test` en `_app` (`ci.yml:121-180`). Les tests prouvent que le DML suffit. |

Note fonctionnelle (hors securite) : un volume `postgres_data` cree avant ce lot ne rejoue
pas l'init, les roles n'existent pas et le backend ne demarre pas. `docker compose down -v`
est necessaire une fois ; a documenter (constat 8).

### 3.5 Dependances et depot

| Point | Statut | Preuve |
|---|---|---|
| `npm audit --omit=dev --audit-level=high` bloquant en CI | conforme | Job `deps-audit`, backend et frontend, sans `continue-on-error`, non conditionne par le filtre de dossiers (`ci.yml:78-90`). Execution locale : backend 0 high / 0 critical (14 moderate, 1 low), frontend 0 high / 0 critical (21 moderate, 2 low), code retour 0 des deux cotes. |
| `dependabot.yml` npm (backend, frontend) + github-actions, hebdomadaire | conforme | `.github/dependabot.yml:4-23`. |
| Actions epinglees par SHA | conforme (reserve) | Toutes les `uses:` du seul workflow `ci.yml` sont en SHA complet avec tag en commentaire. Verification en ligne des SHA a faire (constat 9). |
| `permissions:` minimales | conforme | `permissions: contents: read` au niveau du workflow (`ci.yml:8-9`), aucun job ne l'elargit, aucun `secrets.*`, declencheur `pull_request` (pas `pull_request_target`). |
| Cle SSH de deploiement, protection de `main` | hors lot | Lot 6 / lot 7. |

## Commandes executees

- `docker run --rm -v "$PWD:/repo:ro" zricethezav/gitleaks:latest git /repo --redact --log-opts="dev..fix/security-baseline-secrets"` : 5 commits, aucune fuite.
- `docker run --rm -v "$PWD:/repo:ro" zricethezav/gitleaks:latest dir /repo --redact` : 1 faux positif (ci-dessus).
- `npm audit --omit=dev --audit-level=high` et `npm audit` dans `backend/` et `frontend/`.
- `git diff dev...HEAD`, `git log dev..HEAD`, `git grep` (prenom, adresses mail, `changeme`, motifs de mots de passe et de chaines de connexion).
