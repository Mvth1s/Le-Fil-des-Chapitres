# Déploiement : alwaysdata (backend et base) et Vercel (frontend)

Guide pas à pas, du compte vide à l'application en ligne. Offres gratuites, usage
personnel non lucratif. Sources officielles et limites : `docs/release-0.1.0.md`,
section "Notes de déploiement alwaysdata". Socle de sécurité : `docs/SECURITE.md`.

Dans tout le guide, `<compte>` est le nom de votre compte alwaysdata.

## Vue d'ensemble

| Élément | Plateforme | Comment il est livré |
|---|---|---|
| Backend AdonisJS | Site Node.js alwaysdata (Free) | Workflow `.github/workflows/deploy-backend.yml` (build, rsync, migrations, bascule, redémarrage) |
| Base PostgreSQL 16 | alwaysdata, même compte | Migrations et GRANT rejoués par le workflow |
| Frontend Nuxt | Vercel (Hobby), région `cdg1` | Intégration Git native de Vercel, branche `main` |

Le navigateur ne parle qu'au frontend. Les requêtes `/api/**` passent par un proxy
Nitro qui ajoute l'en-tête `X-Api-Key` exigé par le backend. Le frontend est derrière
une HTTP Basic Auth. `GET /health` reste public.

Ordre à suivre : sections 1 à 8 (backend), puis 9 (frontend), puis 10 (vérification).

---

## 1. Compte alwaysdata

1. Ouvrir <https://www.alwaysdata.com> puis **Sign up**.
2. Choisir l'offre **Free** (quota de 1 Go, base de données et `node_modules` compris).
3. Champ **Account name** : choisir un nom court en minuscules, par exemple `lfdc`.
   Ce nom donne l'adresse du backend `https://<compte>.alwaysdata.net`. L'offre Free
   n'autorise que cette adresse (pas de domaine personnalisé).
4. Activer la double authentification (2FA) : elle est requise pour créer un jeton
   API (section 5). Écran : **Account > Profile**, ou l'écran de sécurité du compte.

Rappel : le backend est un "site", pas un "service" (l'offre Free ne permet pas de
services). Une seule instance tourne, mise en veille après 30 minutes sans requête.

## 2. Base de données et trois utilisateurs

### 2.1 Créer la base

1. Menu **Databases > PostgreSQL**, bouton **Add a database**.
2. **Name** : le nom complet sera `<compte>_lfdc` (alwaysdata préfixe avec le compte).
   Noter ce nom : c'est `DB_NAME` / `DB_DATABASE`.
3. **Type** : PostgreSQL, version **16**.
4. Valider.

### 2.2 Créer les trois utilisateurs

Menu **Databases > PostgreSQL > Users**, bouton **Add a PostgreSQL user**, trois fois.
Pour chaque mot de passe, générer une valeur aléatoire sur votre poste :

```bash
openssl rand -hex 32
```

| Utilisateur (nom complet) | Droits à donner dans l'interface | Rôle |
|---|---|---|
| `<compte>_owner` | Tous les privilèges sur la base `<compte>_lfdc` | Migrations, GRANT, bootstrap. Utilisé uniquement par le workflow. |
| `<compte>_app` | Lecture seule (l'interface ne propose rien de plus fin) | Compte du backend. Les droits d'écriture (DML) sont posés par `grants.sql` à chaque déploiement. |
| `<compte>_ro` | Lecture seule | Consultation et sauvegardes `pg_dump`. |

Les noms d'utilisateurs exacts vous sont affichés par alwaysdata : les recopier tels
quels dans les secrets (section 6).

Hôte de la base : `postgresql-<compte>.alwaysdata.net`, port `5432`.

> **Avertissement : ne jamais revalider les droits de `<compte>_app` dans l'interface
> alwaysdata.** Cette action réinitialise les GRANT posés par `grants.sql`, et le
> backend perd ses droits d'écriture (erreurs 500). Si c'est arrivé, relancer le
> workflow : `gh workflow run deploy-backend.yml` (le script est idempotent).

Conserver les trois mots de passe dans un gestionnaire de mots de passe. Ils ne
doivent jamais apparaître dans le dépôt.

## 3. SSH : clé de déploiement

### 3.1 Générer une clé dédiée

Sur votre poste (une clé uniquement pour ce déploiement, sans passphrase car elle sera
utilisée par la CI) :

```bash
ssh-keygen -t ed25519 -C deploy-lfdc -N "" -f ./deploy-lfdc
```

Deux fichiers : `deploy-lfdc` (privée, deviendra le secret `ALWAYSDATA_SSH_KEY`) et
`deploy-lfdc.pub` (publique).

### 3.2 Déclarer la clé et l'utilisateur SSH

1. Menu **Remote access > SSH/SFTP**.
2. Créer ou ouvrir l'utilisateur SSH du compte. Son nom est `ALWAYSDATA_SSH_USER`.
3. Champ **Authorized keys** (clés publiques autorisées) : coller le contenu de
   `deploy-lfdc.pub`. Enregistrer.
4. Vérifier que la connexion par clé est autorisée pour cet utilisateur.

Hôte SSH : `ssh-<compte>.alwaysdata.net`, port 22. Pas d'accès root.

### 3.3 Empreinte de l'hôte (known_hosts)

Le workflow refuse tout hôte inconnu (`StrictHostKeyChecking=yes`). Il faut lui fournir
la ligne `known_hosts` et la **comparer aux empreintes affichées par alwaysdata**.

```bash
ssh-keyscan ssh-<compte>.alwaysdata.net > known_hosts.txt
ssh-keygen -lf known_hosts.txt
```

Comparer chaque empreinte (`SHA256:...`) avec celles de l'interface alwaysdata
(page d'aide SSH et écran **Remote access > SSH/SFTP**). Si elles diffèrent, ne pas
continuer. Le contenu de `known_hosts.txt` devient `ALWAYSDATA_SSH_KNOWN_HOSTS`.

### 3.4 Tester la connexion

```bash
ssh -i ./deploy-lfdc <utilisateur-ssh>@ssh-<compte>.alwaysdata.net 'node --version'
```

Ne pas répéter les essais en cas d'échec : alwaysdata bloque l'IP après une dizaine
d'échecs.

Une fois la clé privée copiée dans le secret GitHub (section 6), supprimer les fichiers
locaux `deploy-lfdc`, `deploy-lfdc.pub` et `known_hosts.txt`.

## 4. Site Node.js

### 4.1 Créer le site

1. Menu **Web > Sites**, bouton **Add a site**.
2. **Name** : `lfdc-backend`.
3. **Addresses** : `<compte>.alwaysdata.net`.
4. **Type** : Node.js.
5. **Command** : `node <APP_DIR>/current/bin/server.js`, avec `<APP_DIR>` le chemin
   absolu choisi pour `ALWAYSDATA_APP_DIR`, par exemple
   `node /home/<compte>/lfdc/current/bin/server.js`.
   Utiliser `node` (ou `/usr/bin/node`), jamais `nodejs`.
6. **Working directory** : laisser vide ou mettre `<APP_DIR>/current`. Les chemins
   restent absolus de toute façon.
7. Ne pas enregistrer tout de suite si `current` n'existe pas encore : le site
   démarrera au premier déploiement (section 8).

`<APP_DIR>` doit être un chemin absolu simple (lettres, chiffres, `.`, `_`, `-`),
par exemple `/home/<compte>/lfdc`. Le workflow le refuse sinon.

### 4.2 Version de Node

Menu **Environment > Node.js** : choisir **Node 24**. Le workflow vérifie la version
avant de toucher à la base et échoue si ce n'est pas `v24.*`.

### 4.3 Variables d'environnement du site

Menu **Environment** (variables du site) ou champ **Environment** du site. Format
`NOM=valeur`, une par ligne.

Générer les deux secrets sur votre poste :

```bash
openssl rand -hex 16   # APP_KEY (32 caractères)
openssl rand -hex 32   # API_KEY (64 caractères)
```

| Variable | Valeur | Remarque |
|---|---|---|
| `NODE_ENV` | `production` | Active les contrôles de démarrage (secrets obligatoires) |
| `TZ` | `UTC` | |
| `LOG_LEVEL` | `info` | |
| `APP_KEY` | sortie de `openssl rand -hex 16` | Chiffrement AdonisJS |
| `API_KEY` | sortie de `openssl rand -hex 32` | Même valeur que `NUXT_API_KEY` sur Vercel |
| `DB_HOST` | `postgresql-<compte>.alwaysdata.net` | |
| `DB_PORT` | `5432` | |
| `DB_DATABASE` | `<compte>_lfdc` | |
| `DB_USER` | `<compte>_app` | Jamais `_owner` |
| `DB_PASSWORD` | mot de passe de `_app` | |
| `NODE_OPTIONS` | `--max-old-space-size=128` | Plafond mémoire de Node. Pic mesuré 157 Mo sur 256 Mo : voir `docs/release-0.1.0.md`, hypothèse H1 |

`HOST` et `PORT` sont fournis par alwaysdata : ne pas les définir.

> **Mémoire.** La limite de 256 Mo est par compte, pas par site. Pendant un déploiement, les migrations tournent à côté du site (le workflow les limite). Si le site est tué pendant un déploiement, relancer le workflow (`gh workflow run deploy-backend.yml --ref main`) ou arrêter le site avant de déployer.

**Ne jamais mettre sur le site** : `DB_MIGRATION_USER`, `DB_MIGRATION_PASSWORD`,
`APP_OWNER_USERNAME`, `APP_OWNER_PASSWORD`, ni le mot de passe de `_owner`. Le site
tourne avec `_app` seulement. Si une variable obligatoire manque, le backend refuse
de démarrer en production.

Toute modification du site ou de l'environnement redémarre le site.

## 5. Jeton API et identifiant du site

Le workflow redémarre le site par l'API alwaysdata.

### 5.1 Jeton API

1. Menu **Account > Profiles** (ou **Profile**) : créer un **profil dédié**, par
   exemple `deploy-lfdc`, avec la **seule permission "Sites"**. La 2FA doit être active.
2. Menu **API tokens** : créer un jeton rattaché à ce profil. Application name :
   `lfdc-deploy`.
3. Copier le jeton (affiché une fois). C'est `ALWAYSDATA_API_TOKEN`. Il doit ne
   contenir que lettres, chiffres, `_` et `-`.

### 5.2 Identifiant numérique du site

Dans **Web > Sites**, ouvrir le site : l'identifiant figure dans l'URL de la page
(`.../site/<id>/`). C'est `ALWAYSDATA_SITE_ID` (chiffres uniquement).

Contrôle possible, avec le jeton (la limite de l'API est de 10 requêtes par minute
sans authentification) :

```bash
curl -s --basic -u "<jeton> account=<compte>:" https://api.alwaysdata.com/v1/site/ | head -c 300
```

## 6. Environnement GitHub `production` et secrets

### 6.1 Créer l'environnement

1. Dépôt GitHub > **Settings > Environments > New environment** : nom `production`.
2. **Deployment branches and tags** : **Selected branches and tags**, ajouter la
   règle `main`. Seule `main` peut alors utiliser les secrets.
3. Facultatif : activer **Required reviewers** (vous-même) pour valider chaque
   déploiement à la main.

### 6.2 Secrets

Depuis la racine du dépôt, avec `gh` connecté (`gh auth status`). Chaque commande
demande la valeur en saisie (rien dans l'historique du shell). Pour la clé et le
known_hosts, rediriger le fichier.

```bash
gh secret set --env production ALWAYSDATA_SSH_HOST            # ssh-<compte>.alwaysdata.net
gh secret set --env production ALWAYSDATA_SSH_USER            # utilisateur SSH (3.2)
gh secret set --env production ALWAYSDATA_SSH_KEY < ./deploy-lfdc
gh secret set --env production ALWAYSDATA_SSH_KNOWN_HOSTS < ./known_hosts.txt
gh secret set --env production ALWAYSDATA_API_TOKEN           # jeton (5.1)
gh secret set --env production ALWAYSDATA_ACCOUNT             # <compte>
gh secret set --env production ALWAYSDATA_SITE_ID             # identifiant numérique (5.2)
gh secret set --env production DB_HOST                        # postgresql-<compte>.alwaysdata.net
gh secret set --env production DB_NAME                        # <compte>_lfdc
gh secret set --env production DB_OWNER_USER                  # <compte>_owner
gh secret set --env production DB_OWNER_PASSWORD              # mot de passe de _owner
gh secret set --env production DB_APP_USER                    # <compte>_app (nom seul)
gh secret set --env production DB_RO_USER                     # <compte>_ro (nom seul)
gh secret set --env production APP_OWNER_USERNAME             # pseudo du compte applicatif unique
gh secret set --env production APP_OWNER_PASSWORD             # son mot de passe
gh secret set --env production BACKEND_HEALTH_URL             # https://<compte>.alwaysdata.net/health
```

Mot de passe du compte applicatif unique :

```bash
openssl rand -base64 24
```

Variable (pas un secret) :

```bash
gh variable set --env production ALWAYSDATA_APP_DIR --body "/home/<compte>/lfdc"
```

Vérifier : `gh secret list --env production` doit montrer les 16 secrets, et
`gh variable list --env production` la variable. Le workflow nomme exactement ces
17 éléments ; s'il en manque un, il se termine en succès sans rien déployer et
liste les manquants dans le résumé du run.

Supprimer ensuite les fichiers locaux sensibles :

```bash
shred -u ./deploy-lfdc ./deploy-lfdc.pub ./known_hosts.txt
```

### 6.3 La CI n'a besoin d'aucun secret

Le workflow `ci.yml` (pull requests vers `dev` et `main`) génère à chaque run des
valeurs aléatoires jetables pour Postgres et l'application. Ne rien configurer pour
lui. Seul `deploy-backend.yml` utilise l'environnement `production`.

## 7. Protection de la branche `main`

Objectif : pas de push direct, PR obligatoire, CI verte obligatoire, pas de force-push.

Checks exigés (noms des jobs de `.github/workflows/ci.yml`) :
`changes`, `secrets-scan`, `deps-audit`, `backend-checks`, `backend-test`,
`backend-build`, `frontend-checks`, `frontend-test`, `frontend-build`.

Les jobs backend et frontend sont ignorés (skipped) quand leur dossier n'a pas
changé, ce que GitHub accepte comme réussite.

### 7.1 Par l'interface

**Settings > Branches > Add branch ruleset** (ou *Add classic branch protection rule*),
cible `main` :

- Require a pull request before merging
- Require status checks to pass : ajouter les neuf checks ci-dessus
- Block force pushes
- Restrict deletions

### 7.2 Par la ligne de commande

Protection classique de branche, depuis la racine (remplacer `<proprietaire>` par le
compte GitHub) :

```bash
gh api -X PUT repos/<proprietaire>/Le-Fil-des-Chapitres/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["changes", "secrets-scan", "deps-audit", "backend-checks",
                 "backend-test", "backend-build", "frontend-checks",
                 "frontend-test", "frontend-build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

`required_approving_review_count: 0` : PR obligatoire sans relecteur imposé
(projet à auteur unique). Un dépôt privé sur une offre gratuite peut ne pas proposer
cette API : utiliser alors l'interface ou rendre le dépôt public.

## 8. Premier déploiement

Le site n'est pas encore démarré. Lancer le workflow depuis `main` :

```bash
gh workflow run deploy-backend.yml --ref main
gh run watch
```

Le workflow : build sur le runner, envoi par rsync dans `<APP_DIR>/releases/<release>`,
migrations en `_owner`, rejeu de `grants.sql`, bootstrap (utilisateur unique et
14 genres), bascule atomique du lien `current`, redémarrage du site par l'API,
vérification de `/health` (10 essais espacés de 6 s). Il garde la release en service
et la précédente.

Si le site n'a jamais démarré, le redémarrage par l'API le lance. Sinon, dans
**Web > Sites**, bouton **Restart**.

### 8.1 Vérifier `/health`

```bash
curl -i https://<compte>.alwaysdata.net/health
```

Attendu : `200` et `{"status":"ok"}`. Un `503` avec `{"status":"error"}` signale une
base injoignable (variables `DB_*` du site).

### 8.2 Vérifier que `_app` ne peut pas créer de table

Depuis une session SSH sur alwaysdata (la base n'est documentée comme joignable que
depuis le serveur) :

```bash
ssh <utilisateur-ssh>@ssh-<compte>.alwaysdata.net
psql -h postgresql-<compte>.alwaysdata.net -U <compte>_app -d <compte>_lfdc \
  -c 'CREATE TABLE test_droits (id int);'
```

Le mot de passe est demandé en saisie. Résultat attendu : une erreur contenant
`permission denied for schema public`. Si la table est créée, les droits sont trop
larges : la supprimer avec `_owner` et revoir la section 2.

Contrôle inverse (le backend peut écrire) : le parcours de la section 10.

## 9. Frontend sur Vercel

### 9.1 Compte et import

1. Créer un compte sur <https://vercel.com> avec l'offre **Hobby** (usage personnel
   non commercial). Se connecter avec GitHub.
2. **Add New > Project**, choisir le dépôt `Le-Fil-des-Chapitres` (autoriser
   l'application Vercel sur ce dépôt).
3. **Root Directory** : `frontend` (bouton Edit).
4. **Framework Preset** : Nuxt (détecté automatiquement).
5. Ne pas déployer tout de suite : ouvrir d'abord **Environment Variables**.

### 9.2 Variables d'environnement (environnement Production)

Générer le mot de passe Basic Auth sur votre poste :

```bash
openssl rand -base64 24
```

| Variable | Valeur |
|---|---|
| `NUXT_API_UPSTREAM` | `https://<compte>.alwaysdata.net/api` |
| `NUXT_API_KEY` | la même valeur que `API_KEY` du site alwaysdata |
| `NUXT_BASIC_AUTH_USER` | un identifiant de votre choix |
| `NUXT_BASIC_AUTH_PASSWORD` | sortie de `openssl rand -base64 24` |

Les quatre sont obligatoires : sans l'une d'elles (ou avec un marqueur `<...>`), le
frontend refuse de démarrer et les pages dynamiques répondent 500
(`frontend/server/plugins/check-env.ts`). Elles ne sont jamais envoyées au navigateur.

### 9.3 Branche de production et région

- **Settings > Git > Production Branch** : `main`. Les autres branches produisent des
  déploiements de prévisualisation (Preview), qui n'ont pas les variables Production :
  ils échouent au démarrage, ce qui est voulu.
- La région `cdg1` (Paris) est fixée par `frontend/vercel.json`.

Lancer le déploiement (**Deploy**). Chaque push sur `main` redéploie ensuite.

### 9.4 Ce que Vercel sert sans Basic Auth

Les fichiers statiques (`/_nuxt/*` et le contenu de `frontend/public/`) sont servis
directement par le CDN, sans passer par la fonction : la Basic Auth ne les couvre
pas. Ils ne contiennent aucune donnée. Pour aller plus loin, la fonction **Deployment
Protection** de Vercel peut être activée en option (selon l'offre).

## 10. Vérification finale

| Contrôle | Commande ou action | Attendu |
|---|---|---|
| Basic Auth | Ouvrir l'URL Vercel dans un navigateur privé | Fenêtre d'identifiants ; refus sans bons identifiants |
| Santé du backend | `curl -i https://<compte>.alwaysdata.net/health` | `200` `{"status":"ok"}` |
| Backend sans clé | `curl -i https://<compte>.alwaysdata.net/api/genres` | `401` `{"message":"Unauthorized"}` |
| Backend avec clé | `curl -i -H "X-Api-Key: <API_KEY>" https://<compte>.alwaysdata.net/api/genres` | `200`, 14 genres |
| En-têtes de sécurité | `curl -sI -u <user>:<mdp> https://<url-vercel>/` | `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY` |

Parcours fonctionnel complet, dans le navigateur, une fois connecté :

1. Catalogue : ajouter un webtoon avec un nombre total de chapitres (par exemple 2).
2. Ajouter ce webtoon à la liste de lecture.
3. Cliquer sur `+1 chapitre` : la progression passe à 1 sur 2.
4. Cliquer une seconde fois : le statut passe automatiquement à `completed`.
5. Ouvrir la page statistiques : le webtoon est compté comme terminé.
6. Supprimer le webtoon de test depuis le catalogue.

Le premier appel après 30 minutes d'inactivité est lent (démarrage à froid du site
alwaysdata) : c'est normal.

## 11. En cas de problème

### 11.1 Où regarder

| Où | Comment |
|---|---|
| Déploiement backend | Onglet **Actions** du dépôt, run `Deploy backend`, résumé du run (manquants, rollback) |
| Logs du site alwaysdata | **Web > Sites**, menu du site, **Logs** ; ou en SSH dans `~/admin/logs/` |
| Frontend | Vercel, projet, **Deployments**, déploiement, **Build Logs** et **Runtime Logs** |
| Santé | `curl -i https://<compte>.alwaysdata.net/health` |

Symptômes courants :

| Symptôme | Cause probable | Action |
|---|---|---|
| Workflow vert mais rien déployé | Secret ou variable manquant | Lire le résumé du run, compléter la section 6 |
| `/health` en 503 | Variables `DB_*` du site erronées | Corriger dans Environment (le site redémarre) |
| Écritures en erreur 500 après une action dans l'interface | Droits de `_app` réinitialisés | `gh workflow run deploy-backend.yml --ref main` |
| Backend tué sans message | Dépassement des 256 Mo de RAM | Revoir `NODE_OPTIONS` (hypothèse H1) |
| Vercel 500 sur toutes les pages | Variable `NUXT_*` manquante | Compléter les variables Production, redéployer |
| Connexion SSH refusée plusieurs fois | IP bloquée par alwaysdata | Attendre, ne pas insister |

### 11.2 Rollback du backend

Les migrations déjà appliquées ne sont **pas** annulées. Ne jamais lancer
`migration:fresh`, `migration:reset` ni `db:wipe` sur la base de production.

En SSH sur alwaysdata, lister les releases puis repointer `current` :

```bash
ssh <utilisateur-ssh>@ssh-<compte>.alwaysdata.net
ls -1t <APP_DIR>/releases
ln -sfn <APP_DIR>/releases/<release-precedente> <APP_DIR>/current.tmp \
  && mv -T <APP_DIR>/current.tmp <APP_DIR>/current
```

Puis redémarrer le site : **Web > Sites > Restart**, ou

```bash
curl -fsS -X POST --basic -u "<jeton> account=<compte>:" \
  https://api.alwaysdata.com/v1/site/<ALWAYSDATA_SITE_ID>/restart/
```

Seules la release en service et la précédente sont conservées. Pour annuler une
migration, écrire une nouvelle migration corrective (jamais de retour arrière
manuel sur la production).

Frontend : dans Vercel, **Deployments**, choisir un déploiement précédent réussi,
**Promote to Production** (ou *Instant Rollback*).

### 11.3 Rotation d'un secret compromis

La procédure détaillée de chaque secret est dans `docs/SECURITE.md`. Résumé :

| Secret | Où le changer | Commande de génération |
|---|---|---|
| `API_KEY` / `NUXT_API_KEY` | Site alwaysdata **et** Vercel (même valeur), redémarrer et redéployer | `openssl rand -hex 32` |
| `APP_KEY` | Site alwaysdata | `openssl rand -hex 16` |
| Mot de passe `_app` | Interface alwaysdata (sans revalider les droits), variable `DB_PASSWORD` du site | `openssl rand -hex 32` |
| Mot de passe `_owner` | Interface alwaysdata, secret `DB_OWNER_PASSWORD` | `openssl rand -hex 32` |
| Mot de passe `_ro` | Interface alwaysdata, usage manuel seulement | `openssl rand -hex 32` |
| Clé SSH de déploiement | Retirer l'ancienne clé de Remote access > SSH/SFTP, ajouter la nouvelle, secret `ALWAYSDATA_SSH_KEY` | `ssh-keygen -t ed25519 -C deploy-lfdc -N "" -f ./deploy-lfdc` |
| Jeton API | Révoquer dans alwaysdata, nouveau jeton, secret `ALWAYSDATA_API_TOKEN` | interface |
| Basic Auth | Variables `NUXT_BASIC_AUTH_*` sur Vercel, redéployer | `openssl rand -base64 24` |
| Mot de passe du compte applicatif | Ne se change pas par le workflow (ignoré après le 1er déploiement) : voir `docs/SECURITE.md` | `openssl rand -base64 24` |

Changer le mot de passe d'un utilisateur dans l'interface ne revalide pas ses droits.
En cas de doute sur les GRANT, relancer le workflow.

### 11.4 Sauvegardes

alwaysdata conserve les sauvegardes 3 jours seulement. Pour garder un historique,
exporter régulièrement avec le compte lecture seule (depuis le serveur en SSH) :

```bash
pg_dump -h postgresql-<compte>.alwaysdata.net -U <compte>_ro -d <compte>_lfdc \
  -Fc -f lfdc-$(date +%F).dump
```

Récupérer le fichier avec `scp`, le stocker hors dépôt. Le quota de 1 Go inclut la base
et les fichiers.

---

## Annexe : variables par plateforme

| Variable | Alwaysdata (site) | Vercel | GitHub `production` | Poste local (`.env`) |
|---|---|---|---|---|
| `NODE_ENV=production` | oui | | | non |
| `TZ=UTC` | oui | | | oui (backend) |
| `LOG_LEVEL=info` | oui | | | oui (backend) |
| `NODE_OPTIONS` | oui | | | |
| `APP_KEY` | oui | | | oui |
| `API_KEY` | oui | | | facultatif |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE` | oui | | `DB_HOST`, `DB_NAME` | oui |
| `DB_USER`, `DB_PASSWORD` (`_app`) | oui | | `DB_APP_USER` (nom seul) | oui |
| `DB_RO_USER` | | | oui (nom seul) | |
| `DB_OWNER_USER`, `DB_OWNER_PASSWORD` | **jamais** | | oui | `DB_OWNER_PASSWORD` |
| `APP_OWNER_USERNAME`, `APP_OWNER_PASSWORD` | **jamais** | | oui | facultatif |
| `NUXT_API_UPSTREAM` | | oui | | `frontend/.env` |
| `NUXT_API_KEY` | | oui (= `API_KEY`) | | facultatif |
| `NUXT_BASIC_AUTH_USER`, `NUXT_BASIC_AUTH_PASSWORD` | | oui | | facultatif |
| `ALWAYSDATA_SSH_HOST`, `_SSH_USER`, `_SSH_KEY`, `_SSH_KNOWN_HOSTS` | | | oui | |
| `ALWAYSDATA_API_TOKEN`, `_ACCOUNT`, `_SITE_ID` | | | oui | |
| `ALWAYSDATA_APP_DIR` | | | variable | |
| `BACKEND_HEALTH_URL` | | | oui | |
