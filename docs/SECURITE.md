# Sécurité - Le Fil des Chapitres

Socle de sécurité de la version 0.1.0. Chaque mesure "en place" cite le fichier qui la porte.
Ce qui dépend d'un réglage de plateforme (GitHub, alwaysdata, Vercel) et ne peut pas être
vérifié dans le dépôt est marqué **non vérifiable dans le dépôt**.

Sources : le code du dépôt, les rapports `docs/audits/securite-*.md`, les hypothèses H1 à H12
de `docs/release-0.1.0.md`.

---

## 1. Modèle de menace

**Contexte.** Application personnelle, un seul utilisateur, exposée sur Internet : frontend
Nuxt sur Vercel, backend AdonisJS et PostgreSQL sur alwaysdata. Les données (catalogue de
webtoons, progression de lecture) ne sont pas sensibles : leur divulgation n'aurait pas de
conséquence grave. En revanche leur **intégrité** compte (des mois de suivi de lecture), ainsi
que la **disponibilité** raisonnable du service et la protection des **comptes** qui le font
tourner.

**Acteurs considérés.**

| Acteur | Comportement attendu | Ce qui l'arrête |
|---|---|---|
| Robots et moteurs d'indexation | Explorent et indexent tout ce qui répond | `robots.txt`, `noindex`, Basic Auth |
| Scanners automatiques | Testent chemins connus, failles de frameworks, identifiants par défaut | Basic Auth, clé `X-Api-Key`, 500 génériques, dépendances auditées |
| Attaquant opportuniste | Réutilise un secret fuité (dépôt, logs), tente une injection ou un abus d'API | Aucun secret versionné, gitleaks, validation serveur, compte `_app` sans DDL |

Hors périmètre : attaquant ciblé disposant de moyens importants, compromission des
plateformes elles-mêmes (Vercel, alwaysdata, GitHub).

**Actifs à protéger.**

| Actif | Risque principal | Mesures |
|---|---|---|
| Base PostgreSQL | Altération ou suppression des données | Trois comptes, `_app` limité au DML, sauvegardes plateforme |
| Secrets (clés, mots de passe) | Fuite puis accès direct à l'API ou à la base | Aucune valeur en dur, variables de plateforme, gitleaks |
| Compte alwaysdata | Prise de contrôle de l'hébergement | Clé SSH dédiée, jeton API sur profil restreint |
| Dépôt GitHub | Injection de code déployé automatiquement | Environnement `production`, actions épinglées, permissions minimales |

---

## 2. Socle en place

### 2.1 Secrets

| Mesure | Détail | Fichier |
|---|---|---|
| Aucune valeur en dur | Les fichiers d'exemple ne contiennent que des marqueurs `<a-generer: ...>` ou des valeurs vides | `.env.example`, `backend/.env.example` |
| `.env` non versionné | `.env` et `.env.*` ignorés, sauf `.env.example` | `.gitignore` |
| Source unique en local | `.env` racine lu par compose ; `${VAR:?message}` fait échouer le démarrage si un secret manque | `docker-compose.yml` |
| CI à valeurs éphémères | Mots de passe PostgreSQL et `APP_KEY` générés par `openssl rand` à chaque run, masqués (`::add-mask::`) | `.github/workflows/ci.yml` (step "Generate ephemeral secrets") |
| Écart assumé en CI | Les GitHub Secrets `CI_APP_KEY` / `CI_DB_PASSWORD` prévus initialement ne sont pas utilisés : rien à stocker ni à faire tourner, CI fonctionnelle avant toute création de secret | `docs/release-0.1.0.md` (notes de décision) |
| Environnement GitHub `production` | Seul le job de déploiement lit les secrets de production ; job ignoré proprement si un secret manque (noms seulement dans le résumé) | `.github/workflows/deploy-backend.yml` (`environment: production`, step "Check deployment secrets") |
| Secrets hors de `npm ci` et des lignes de commande | Secrets exposés uniquement aux steps qui en ont besoin, transmis au serveur par l'entrée standard de `bash -s`, à `curl` par `-K -` | `.github/workflows/deploy-backend.yml` |
| Validation au démarrage, backend | Refus de démarrer si `APP_KEY` (16 car. min.), `DB_PASSWORD` manquent ; `API_KEY` obligatoire en production (32 car. min.) | `backend/start/env.ts` |
| Validation au démarrage, frontend | En build de production, refus si `basicAuthUser`, `basicAuthPassword`, `apiKey` ou `apiUpstream` est vide ; seuls les noms des clés sont cités | `frontend/server/plugins/check-env.ts` |
| Marqueurs refusés | Toute valeur commençant par `<` (marqueur de `.env.example`) est rejetée | `backend/start/env.ts` (fonction `secret`), `frontend/server/plugins/check-env.ts`, `docker/postgres/init/01-roles.sh` |
| Mots de passe hachés | Utilisateur unique créé avec `hash.make` (driver scrypt), mot de passe en clair jamais logué | `backend/database/seeders/bootstrap_seeder.ts`, `backend/config/hash.ts` |

Les valeurs de production vivent dans les variables du site alwaysdata, les variables
d'environnement Vercel et les secrets de l'environnement GitHub `production`
(**non vérifiable dans le dépôt**).

### 2.2 Données personnelles

| Mesure | Détail | Source |
|---|---|---|
| Pseudo uniquement | Seul le pseudo `Mvth1s` apparaît dans le code ; l'utilisateur local s'appelle `mvth1s` | `backend/database/seeders/user_seeder.ts` |
| Historique Git non réécrit | 20 merges faits sur GitHub portent le nom réel du profil et 2 commits une adresse personnelle. **Non réécrit, décision de Mvth1s.** Aucun nom ni adresse n'est recopié ici | `docs/release-0.1.0.md` (points ouverts), `docs/audits/securite-2026-11-10-lot1.md` |
| Prévention | Remplacer le champ "Name" du profil GitHub par le pseudo et utiliser l'adresse noreply GitHub dans `user.email` (**non vérifiable dans le dépôt**) | `docs/release-0.1.0.md`, `docs/audits/securite-2026-11-11-lot5.md` |

### 2.3 Base de données : trois comptes

| Compte | Droits | Utilisé par | Fichier |
|---|---|---|---|
| `_owner` | Propriétaire du schéma, DDL | Migrations, `grants.sql`, bootstrap (déploiement en SSH) | `docker/postgres/init/01-roles.sh`, `.github/workflows/deploy-backend.yml` |
| `_app` | `SELECT, INSERT, UPDATE, DELETE` sur les tables, `USAGE, SELECT` sur les séquences | Backend en fonctionnement, tests CI | `backend/database/sql/grants.sql`, `docker-compose.yml`, `.github/workflows/ci.yml` |
| `_ro` | `SELECT` seul | Consultation (Adminer, psql), sauvegardes futures | `backend/database/sql/grants.sql` |

Points clés :

- `grants.sql` pose aussi des `ALTER DEFAULT PRIVILEGES` pour les tables créées par les
  futures migrations, ne crée aucun rôle et ne contient aucun mot de passe.
- Le même modèle tourne en local et en CI : les deux montent les mêmes
  `docker/postgres/init/01-roles.sh` et `grants.sql`. Les tests CI s'exécutent en `_app`,
  ce qui prouve que le DML suffit (`.github/workflows/ci.yml`, job `backend-test`).
- `REVOKE CREATE ON SCHEMA public FROM PUBLIC` en local (`docker/postgres/init/01-roles.sh`).
- En production, `grants.sql` est rejoué après chaque migration par le workflow de
  déploiement. **Ne jamais revalider les droits de `_app` dans l'interface alwaysdata** :
  cela réinitialise les GRANT (H3) ; si c'est fait, relancer le workflow.
- Les rôles de production sont créés dans l'interface alwaysdata
  (**non vérifiable dans le dépôt**).

### 2.4 Exposition HTTP

| Mesure | Détail | Fichier |
|---|---|---|
| Proxy Nitro | Le navigateur ne parle qu'au frontend ; `/api/**` est relayé côté serveur. En-têtes client relayés par liste blanche (`accept`, `content-type`, `accept-language`) : jamais `Authorization`, `Cookie` ni `Host`. Segments `.` / `..` refusés (400), redirections non suivies, erreur réseau en 502 générique. Délai de 10 s vers l'amont, lecture de la réponse comprise (504), corps entrant limité à 100 ko (413 sans appeler le backend) ; un corps chunked est lu en mémoire avant le contrôle (raccourci documenté dans le fichier, plafond de la plateforme) | `frontend/server/api/[...path].ts` |
| Basic Auth | Devant tout ce que sert Nitro (pages SSR, `/api`). Comparaison à temps constant (`timingSafeEqual` sur SHA-256), les deux comparaisons toujours exécutées | `frontend/server/middleware/basic-auth.ts` |
| Clé `X-Api-Key` | Ajoutée par le proxy, exigée par le backend sur tout `/api` quand `API_KEY` est défini (toujours en production). Comparaison à temps constant, clé jamais loguée | `backend/app/middleware/api_key_middleware.ts`, `backend/start/routes.ts`, `backend/start/kernel.ts` |
| `/health` public | Hors `/api`, sans clé ; répond seulement `ok` / `error`, sans version ni détail. C'est la seule route publique : aucune route `GET /` | `backend/start/routes.ts` |
| En-têtes de sécurité | HSTS, `nosniff`, `Referrer-Policy: same-origin`, `X-Frame-Options: DENY`, `Permissions-Policy`, CSP (`frame-ancestors 'none'`, `object-src 'none'`, `connect-src 'self'`...), en production via `routeRules` | `frontend/nuxt.config.ts` |
| CORS liste blanche | Origines lues dans `CORS_ORIGINS`, vide en production (aucun accès cross-origin), `credentials: false` | `backend/config/cors.ts` |
| 500 génériques | En production, toute erreur 5xx renvoie `{ "message": "Internal server error" }` ; l'erreur complète reste dans les logs | `backend/app/exceptions/handler.ts` |
| Identifiants invalides | Un `:id` non UUID ne correspond à aucune route (404) au lieu d'atteindre PostgreSQL | `backend/start/routes.ts` |
| Limites de corps | JSON et formulaires limités à 100 ko, multipart désactivé (aucun upload) | `backend/config/bodyparser.ts` |
| Logs sans secrets | Redaction de `authorization`, `cookie`, `x-api-key`, `password` ; le plugin `check-env` ne cite que des noms de clés | `backend/config/logger.ts`, `frontend/server/plugins/check-env.ts` |
| Non-indexation | `Disallow: /`, meta `robots` et en-tête `X-Robots-Tag: noindex, nofollow` | `frontend/public/robots.txt`, `frontend/nuxt.config.ts` |
| Ports locaux | PostgreSQL (5432), backend (3333), frontend (3000) et Adminer (8080) liés à `127.0.0.1` (Docker contourne le pare-feu de l'hôte) | `docker-compose.yml` |
| Validation serveur | Validators AdonisJS avant tout accès à la base | `backend/app/validators/` |

### 2.5 Dépendances, dépôt et livraison

| Mesure | Détail | Fichier |
|---|---|---|
| `npm audit` bloquant | `--omit=dev --audit-level=high` sur backend et frontend, à chaque PR | `.github/workflows/ci.yml` (job `deps-audit`) |
| gitleaks bloquant | Binaire officiel 8.30.1 vérifié par SHA-256, scan des commits de la PR, `--redact` | `.github/workflows/ci.yml` (job `secrets-scan`) |
| Faux positifs tracés | Chaque exception est commentée : exemples de commande curl issus de la documentation (aucune clé réelle) ; clé `APP_KEY` fixe de l'ancienne CI éphémère (ajoutée au commit `5f458c0`, retirée au commit `9ca5d62`, aucune donnée réelle, réutilisée dans aucun `.env` local). Elle reste dans l'historique public : **ne jamais la réutiliser** (entrée `5f458c0`, `.github/workflows/ci.yml`, règle `generic-api-key`) | `.gitleaksignore` |
| Dependabot | Hebdomadaire : npm backend, npm frontend, GitHub Actions ; 5 PR max par écosystème | `.github/dependabot.yml` |
| Actions épinglées par SHA | `actions/checkout`, `actions/setup-node` épinglées par SHA complet, tag en commentaire | `.github/workflows/ci.yml`, `.github/workflows/deploy-backend.yml` |
| Permissions minimales | `permissions: contents: read` sur les deux workflows ; `persist-credentials: false` sur chaque `actions/checkout` (le jeton n'est pas laissé dans `.git/config`) | `.github/workflows/ci.yml`, `.github/workflows/deploy-backend.yml` |
| Échec explicite des scripts | `shell: bash` au niveau du job de déploiement : `-eo pipefail`, une commande en échec dans un tube arrête le step | `.github/workflows/deploy-backend.yml` |
| Rollback préservé | Le nettoyage des anciennes releases ne supprime jamais la release en service ni la cible précédente de `current` | `.github/workflows/deploy-backend.yml` (step "Migrate, grant, bootstrap and switch") |
| Clé SSH de déploiement dédiée | Clé privée en secret `ALWAYSDATA_SSH_KEY`, écrite en fichier 600 sous `RUNNER_TEMP`, supprimée en fin de job (`if: always()`) | `.github/workflows/deploy-backend.yml` |
| Hôte SSH vérifié | `known_hosts` fourni en secret, `StrictHostKeyChecking yes`, `BatchMode yes` (pas d'essais répétés qui bloqueraient l'IP du runner) | `.github/workflows/deploy-backend.yml` |
| Entrées contrôlées | `ALWAYSDATA_APP_DIR`, `ALWAYSDATA_SITE_ID`, `ALWAYSDATA_ACCOUNT`, `ALWAYSDATA_API_TOKEN` validés par expression régulière avant usage | `.github/workflows/deploy-backend.yml` |
| Déploiement non interruptible | `concurrency` sans annulation : une migration n'est jamais coupée | `.github/workflows/deploy-backend.yml` |
| Protection de branche | **À activer** sur `main` et `dev` (PR obligatoire, check CI requis). **Non vérifiable dans le dépôt** | Réglage GitHub |

### 2.6 Écarts connus et assumés

| Écart | Conséquence | Décision ou piste |
|---|---|---|
| Fichiers statiques Vercel servis sans Basic Auth | Les assets du CDN (JS, CSS, images de `public/`) ne passent pas par la fonction Nitro (`frontend/server/plugins/check-env.ts`, commentaire) | Aucune donnée exposée. Option : Deployment Protection de Vercel |
| CSP avec `'unsafe-inline'` (H12) | Nuxt injecte des scripts inline sans nonce ; la CSP limite moins un XSS | Accepté en 0.1.0 (`frontend/nuxt.config.ts`) ; nonces en amélioration future |
| Jeton API alwaysdata non restreignable nativement | Un jeton a les droits du profil qui le crée (H7) | Profil alwaysdata dédié avec la seule permission "Sites" (**non vérifiable dans le dépôt**) |
| Restrictions des agents Claude déclaratives | Aucune règle `permissions.deny` (pas de `.claude/settings.json`) n'impose les interdits | Décision de Mvth1s (audit lot 3, M3) |
| Données hébergées en France (H10) | alwaysdata : serveurs en région parisienne, chiffrement au repos ; datacenter de sauvegarde d'un prestataire non nommé | Accepté |
| Isolation partielle des secrets du workflow | `npm ci` tourne sans secret, mais un script `postinstall` d'une dépendance pourrait écrire dans `$GITHUB_ENV` et influencer les steps suivants, qui eux reçoivent des secrets (`.github/workflows/deploy-backend.yml`, step "Build backend") | Accepté ; atténué par `npm audit`, Dependabot et le lockfile |
| Secrets `_owner` dans l'environnement distant | Pendant le déploiement, `DB_PASSWORD` de `_owner` est exporté dans l'environnement des process `node ace` et `psql` sur alwaysdata, lisible par le même utilisateur Unix que le site (`.github/workflows/deploy-backend.yml`, step "Migrate, grant, bootstrap and switch") | Accepté : exposition limitée à la durée du déploiement, jamais écrit sur disque |
| `_app` a le DML sur `adonis_schema*` | `grants.sql` accorde le DML sur toutes les tables du schéma `public`, y compris les tables de suivi des migrations (`backend/database/sql/grants.sql`) | Accepté en 0.1.0 ; révoquer ces tables pour `_app` en amélioration future |
| Failles npm modérées restantes | `deepmerge`, `minimatch`, `glob` (présents dans `backend/package-lock.json` et `frontend/package-lock.json`) : correctifs uniquement en version majeure, sous le seuil `high` du job `deps-audit` donc non bloquants | Accepté ; suivi par Dependabot (`.github/dependabot.yml`). Résultat de `npm audit` non rejoué par la documentation |
| Images Docker par tag | `postgres:16`, `adminer:4`, `node:24-alpine` non épinglées par digest ; Dependabot ne couvre pas l'écosystème `docker` | Local et CI uniquement ; digest en amélioration future (audit lot 2, constat 10) |

---

## 3. Rotation des secrets

Générer chaque nouvelle valeur avec `openssl rand -hex 32` (ou `-hex 16` pour `APP_KEY`),
directement dans l'interface cible, sans la coller dans un fichier versionné, un ticket ou
un message. Changer une variable de site alwaysdata redémarre le site ; changer une variable
Vercel n'a d'effet qu'au déploiement suivant.

| Secret | Où le changer | Ordre | Quoi redéployer |
|---|---|---|---|
| `APP_KEY` | Variables du site alwaysdata ; local : `.env` | 1. Générer (16 octets hex). 2. Remplacer dans le site alwaysdata | Redémarrage automatique du site. Aucun code de `backend/app` n'utilise le chiffrement : rien à re-chiffrer |
| `API_KEY` (backend) et `NUXT_API_KEY` (frontend) | Variable du site alwaysdata et variable Vercel ; local : `API_KEY` dans `.env` (sert aux deux) | Toujours ensemble, même valeur. 1. Saisir la nouvelle valeur dans Vercel. 2. La saisir dans alwaysdata (redémarrage). 3. Redéployer Vercel aussitôt | Site alwaysdata et déploiement Vercel. Entre les étapes 2 et 3, `/api` répond 401 (une seule clé acceptée à la fois) |
| Basic Auth (`NUXT_BASIC_AUTH_USER`, `NUXT_BASIC_AUTH_PASSWORD`) | Variables Vercel ; local : `.env` | 1. Changer les deux variables. 2. Redéployer | Déploiement Vercel. Le navigateur redemande les identifiants |
| Mot de passe `_app` | Interface alwaysdata (utilisateurs PostgreSQL), puis variable `DB_PASSWORD` du site | 1. Changer le mot de passe dans alwaysdata. 2. Mettre à jour `DB_PASSWORD` du site (redémarrage). 3. Relancer le workflow `deploy-backend.yml` (`workflow_dispatch`) pour rejouer `grants.sql`, la modification dans l'interface pouvant réinitialiser les droits (H3) | Site alwaysdata, puis workflow. Coupure de l'API entre 1 et 2 |
| Mot de passe `_owner` | Interface alwaysdata, puis secret `DB_OWNER_PASSWORD` de l'environnement GitHub `production` | 1. Interface alwaysdata. 2. Secret GitHub. 3. Relancer le workflow pour vérifier | Workflow seulement : le site n'utilise jamais `_owner` |
| Mot de passe `_ro` | Interface alwaysdata (le mot de passe n'est stocké nulle part dans le dépôt ni dans GitHub) | 1. Interface alwaysdata. 2. Relancer le workflow pour rejouer `grants.sql` | Workflow |
| Mots de passe locaux (`_owner`, `_app`, `_ro`, `postgres`) | `.env` racine + `ALTER ROLE ... PASSWORD` en superuser dans le conteneur | 1. `ALTER ROLE`. 2. `.env`. 3. Redémarrer les services. Les mots de passe ne sont lus qu'au premier démarrage du volume (`.env.example`) | `docker compose up` |
| Clé SSH de déploiement | Paire générée en local (`ssh-keygen -t ed25519`, clé dédiée au déploiement), clé publique dans alwaysdata (Remote access > SSH), clé privée dans le secret `ALWAYSDATA_SSH_KEY` | 1. Ajouter la nouvelle clé publique. 2. Remplacer le secret GitHub. 3. Relancer le workflow. 4. Retirer l'ancienne clé publique. 5. Supprimer la copie locale de la clé privée | Workflow |
| `ALWAYSDATA_SSH_KNOWN_HOSTS` | Secret GitHub | Seulement si l'hôte change de clé : relever la ligne (`ssh-keyscan`), **comparer l'empreinte à celle affichée par alwaysdata**, puis remplacer le secret | Workflow |
| Jeton API alwaysdata | Profil alwaysdata dédié (permission "Sites" seule, 2FA requise pour créer un jeton, H7), secret `ALWAYSDATA_API_TOKEN` | 1. Créer le nouveau jeton. 2. Remplacer le secret. 3. Relancer le workflow (step "Restart site"). 4. Révoquer l'ancien jeton | Workflow |
| `APP_OWNER_PASSWORD` | Secret de l'environnement GitHub `production` | Remplacer le secret | Aucun effet immédiat : `bootstrap_seeder.ts` ne crée l'utilisateur que si la table `users` est vide et ne modifie jamais un utilisateur existant. Aucune connexion n'existe en phase 1. Changer le hash stocké n'a pas de commande dédiée dans le dépôt |
| Secrets CI | Aucun | Sans objet : valeurs générées à chaque run | Aucun |

En cas de fuite avérée : faire tourner le secret concerné **avant** toute autre action, puis
vérifier les logs de la plateforme. Un secret poussé dans Git est considéré comme compromis
même après suppression du commit.

---

## 4. Améliorations futures

| Priorité | Mesure | Effort |
|---|---|---|
| Haute | Rate limiting sur le backend et protection anti brute force de la Basic Auth (aujourd'hui aucune limite de tentatives dans `frontend/server/middleware/basic-auth.ts`) | Moyen |
| Haute | Sauvegardes externes chiffrées : `pg_dump` régulier avec le compte `_ro`, chiffré, stocké hors alwaysdata (les sauvegardes Free ne couvrent que 3 jours) | Moyen |
| Haute | Surveillance et alertes : sonde externe sur `/health` (avec délai de requête pour détecter les lenteurs et la mise en veille), alerte sur échec du workflow de déploiement | Faible |
| Haute | Activer la protection de branche sur `main` et `dev` (PR et CI obligatoires) | Faible |
| Moyenne | Retirer à `_app` le DML sur `adonis_schema` et `adonis_schema_versions` (`REVOKE` dans `grants.sql`) | Faible |
| Basse | Durcir l'isolation du workflow : `npm ci --ignore-scripts` au build si les dépendances le permettent | Faible |
| Moyenne | Rotation périodique planifiée des secrets (section 3), au moins annuelle et à chaque doute | Faible |
| Moyenne | Audit OWASP ASVS niveau 1 complet | Moyen |
| Basse | CSP sans `'unsafe-inline'` (nonces sur les scripts Nuxt) | Élevé |
| Moyenne | Résorber les failles npm modérées (`deepmerge`, `minimatch`, `glob`) en acceptant les montées de version majeure proposées par Dependabot | Moyen |
| Basse | Images Docker épinglées par digest, écosystème `docker` ajouté à Dependabot | Faible |
| Basse | Authentification réelle (Phase 3), qui remplacera la Basic Auth comme protection d'accès | Élevé |
