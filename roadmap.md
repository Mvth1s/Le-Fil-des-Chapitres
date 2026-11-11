# roadmap.md - Le Fil des Chapitres

> Détail des étapes de développement. Chaque étape correspond à une ligne de la roadmap
> haut niveau du `CAHIER_DES_CHARGES.md` (section 12). Une branche par étape, fusion
> uniquement quand le critère "Terminé quand" est vérifié. Contexte général du projet :
> voir `CLAUDE.md`.

---

## Vue d'ensemble - Phase 1 (MVP, version 0.1.0)

| # | Étape | Branche | Fait |
|---|---|---|---|
| 1 | Mise en place du projet (Docker local) | `chore/setup-project` | [x] |
| 2 | Schéma de base de données et migrations | `feature/database-schema` | [x] |
| 3 | API REST : CRUD webtoons (catalogue) | `feature/api-webtoons` | [x] |
| 4 | API REST : liste de lecture et statistiques | `feature/api-user-list` | [x] |
| 5 | Design system (composants, charte graphique) | `feature/design-system` | [x] |
| 6 | Interface : catalogue (liste + fiche détail) | `feature/catalogue-ui` | [x] |
| 7 | Interface : formulaires d'ajout et de modification | `feature/webtoons-forms` | [x] |
| 8 | Interface : liste de lecture (filtres, statuts) | `feature/reading-list-ui` | [x] |
| 9 | Interface : mise à jour rapide de la progression | `feature/progress-quick-update` | [x] |
| 10 | Interface : statistiques basiques | `feature/stats-ui` | [x] |
| 11 | Déploiement (alwaysdata, Vercel) | `deploy/production-setup` | [ ] |

Étape 11 : tout ce qui vit dans le dépôt est livré (proxy Nitro, Basic Auth, `X-Api-Key`,
rôles PostgreSQL, `deploy-backend.yml`, `docs/DEPLOIEMENT.md`). Reste à faire à la main :
création des comptes alwaysdata et Vercel, premier déploiement, recette en ligne
(voir `docs/DEPLOIEMENT.md`). L'étape reste donc non cochée.

Les Phases 2 (0.2.0) et 3 (1.0.0) restent au niveau de la liste du `CAHIER_DES_CHARGES.md`
section 12 : elles seront détaillées étape par étape une fois la Phase 1 terminée.

---

## Conventions Git détaillées

**Branches**

- `main` : code stable, déployé. Jamais de commit direct.
- `dev` : branche d'intégration. Chaque étape part de `dev` et y retourne par fusion.
- Une branche par étape, nommée `<prefixe>/<nom-kebab-case>` (voir table ci-dessus).
- Préfixes autorisés : `feature/`, `fix/`, `style/`, `chore/`, `refactor/`, `deploy/`.
- Supprimer la branche d'étape après fusion dans `dev`.

**Commits**

- Format : `type: description courte en minuscules`.
- Types : `feat`, `fix`, `chore`, `style`, `refactor`, `docs`, `test`, `deploy`.
- Un commit doit rester lisible seul : éviter les commits fourre-tout qui mélangent
  plusieurs sujets sans rapport.

**Cycle d'une étape**

1. Partir de `dev` à jour, créer la branche de l'étape.
2. Développer, committer par sous-tâche cohérente.
3. Vérifier le critère "Terminé quand" de l'étape (test manuel systématique avant toute
   fusion, en particulier pour les endpoints backend).
4. Relecture par le sous-agent `code-reviewer` avant fusion.
5. Fusionner dans `dev`. Ne jamais fusionner dans `main` sans validation explicite de Mvth1s.
6. Mettre à jour la documentation (`docs-keeper`) si l'étape a changé un endpoint, un
   schéma ou l'architecture.

**Ce qu'on ne fait jamais**

- Committer un `.env` ou un secret en clair.
- Passer à l'étape suivante avant que le critère "Terminé quand" soit rempli.
- Modifier une étape déjà fusionnée dans `dev` en amendant un commit ancien.

---

## Phase 1 - Détail des étapes

### Étape 1 - Mise en place du projet (Docker local)

**Branche :** `chore/setup-project`
**Dépend de :** rien (première étape)

Objectif : avoir un projet full-stack qui démarre en local via Docker.

Contenu :
- Structure de dossiers `frontend/` et `backend/`
- Initialisation AdonisJS 7 (Node.js 24) dans `backend/` (starter `api`, Lucid, PostgreSQL)
- Initialisation Nuxt 4 + TypeScript dans `frontend/`
- Dockerfile de dev pour chaque service, avec hot reload
- `docker-compose.yml` à la racine : nuxt (3000), adonis (3333), postgres 16 (5432)
- `frontend/.env.example` et `backend/.env.example`
- `.gitignore` complet (`.env`, `node_modules/`, `build/`, `.nuxt/`, `.output/`)

Terminé quand :
- `docker compose up` lance les trois services sans erreur.
- Aucune migration, aucun modèle, aucun endpoint, aucune page n'est créé à cette étape.

---

### Étape 2 - Schéma de base de données et migrations

**Branche :** `feature/database-schema`
**Dépend de :** Étape 1

Objectif : poser la structure de données définie dans `CLAUDE.md` section 5.

Contenu :
- Migrations pour `users`, `webtoons`, `genres`, `webtoon_genres`, `user_webtoons`
  (UUID en clé primaire, `snake_case`, contraintes UNIQUE et cascades)
- Modèles Lucid correspondants avec leurs relations
- Seeder des 14 genres prédéfinis

Terminé quand :
- `node ace migration:run` s'exécute sans erreur sur la base Docker locale.
- Les 5 tables existent avec les contraintes attendues (vérification manuelle en SQL).
- Le seeder insère les 14 genres sans doublon.

---

### Étape 3 - API REST : CRUD webtoons (catalogue)

**Branche :** `feature/api-webtoons`
**Dépend de :** Étape 2

Objectif : exposer le catalogue global de webtoons en JSON.

Contenu :
- `WebtoonsController` : `index`, `show`, `store`, `update`, `destroy`
- Validators de création et de mise à jour
- Route `GET /api/genres`

Terminé quand :
- Tous les endpoints `/api/webtoons*` et `/api/genres` sont testés manuellement
  (Postman / Insomnia / Thunder Client) avec les codes HTTP corrects
  (201, 200, 204, 422, 404) et la validation serveur active.

---

### Étape 4 - API REST : liste de lecture et statistiques

**Branche :** `feature/api-user-list`
**Dépend de :** Étape 3

Objectif : exposer la progression de lecture individuelle.

Contenu :
- `UserListController` : `index`, `store`, `update`, `destroy`
- Endpoint `PATCH /api/user/list/:id/progress`
- `StatsController` : `GET /api/stats`
- Règle métier : passage automatique au statut `completed` quand
  `chapters_read` atteint `chapters_total` ; `chapters_read` ne dépasse jamais
  `chapters_total` quand celui-ci n'est pas NULL

Terminé quand :
- Tous les endpoints `/api/user/list*` et `/api/stats` sont testés manuellement.
- La règle métier de progression est vérifiée par un test manuel explicite.

---

### Étape 5 - Design system (composants, charte graphique)

**Branche :** `feature/design-system`
**Dépend de :** Étape 1 (indépendante du backend, peut être menée en parallèle des étapes 2 à 4)

Objectif : poser les fondations visuelles avant d'écrire des pages.

Contenu :
- Intégration des polices Google Fonts (Dancing Script, Playfair Display)
- Variables CSS de la charte graphique (`CLAUDE.md` section 8)
- Composants `AppButton`, `AppCard`, `AppBadge`, `AppInput`, `AppSelect`, `AppNavbar`

Terminé quand :
- Chaque composant existe, est visible sur une page de démonstration, respecte la
  charte graphique et les contrastes WCAG AA.

---

### Étape 6 - Interface : catalogue (liste + fiche détail)

**Branche :** `feature/catalogue-ui`
**Dépend de :** Étapes 3 et 5

Objectif : afficher le catalogue global côté frontend.

Contenu :
- Page liste des webtoons, consommant `GET /api/webtoons`
- Page fiche détail, consommant `GET /api/webtoons/:id`
- Gestion des états de chargement et d'erreur

Terminé quand :
- Navigation liste → détail fonctionnelle contre l'API locale réelle (pas de données
  mockées).

---

### Étape 7 - Interface : formulaires d'ajout et de modification

**Branche :** `feature/webtoons-forms`
**Dépend de :** Étape 6

Objectif : permettre l'édition du catalogue depuis le frontend.

Contenu :
- Formulaire de création (`POST /api/webtoons`)
- Formulaire de modification (`PUT /api/webtoons/:id`)
- Affichage des erreurs de validation (422)

Terminé quand :
- Création et modification fonctionnent de bout en bout, erreurs 422 affichées
  correctement à l'utilisateur.

---

### Étape 8 - Interface : liste de lecture (filtres, statuts)

**Branche :** `feature/reading-list-ui`
**Dépend de :** Étapes 4 et 5

Objectif : afficher et filtrer la liste de lecture personnelle.

Contenu :
- Page liste de lecture, consommant `GET /api/user/list`
- Filtres par statut et par genre
- Changement de statut manuel

Terminé quand :
- La liste de lecture s'affiche et se filtre correctement contre l'API locale réelle.

---

### Étape 9 - Interface : mise à jour rapide de la progression

**Branche :** `feature/progress-quick-update`
**Dépend de :** Étape 8

Objectif : mettre à jour la progression sans quitter la liste.

Contenu :
- Bouton "+1 chapitre" par élément de la liste
- Appel `PATCH /api/user/list/:id/progress`
- Répercussion immédiate du changement de statut automatique si applicable

Terminé quand :
- Le bouton met à jour l'affichage sans rechargement de page, y compris le passage
  automatique au statut `completed`.

---

### Étape 10 - Interface : statistiques basiques

**Branche :** `feature/stats-ui`
**Dépend de :** Étapes 4 et 5

Objectif : donner une vue d'ensemble de la lecture.

Contenu :
- Page ou widget consommant `GET /api/stats`

Terminé quand :
- Les statistiques affichées correspondent au contenu réel de la base locale.

---

### Étape 11 - Déploiement (alwaysdata, Vercel)

**Branche :** `deploy/production-setup`
**Dépend de :** Étapes 1 à 10 terminées

Objectif : rendre l'application accessible en ligne, protégée, conformément à
`CLAUDE.md` section 11 et à `CAHIER_DES_CHARGES.md` sections 7 et 11. Le détail
opérationnel vit dans `docs/DEPLOIEMENT.md`, la politique de sécurité dans `docs/SECURITE.md`.

Contenu :
- Backend AdonisJS sur un site Node.js alwaysdata (offre Free), PostgreSQL alwaysdata
  sur le même compte, frontend Nuxt sur Vercel Hobby (région `cdg1`)
- Trois comptes PostgreSQL : `_owner` (migrations, GRANT, bootstrap), `_app` (DML seul,
  utilisé par le backend), `_ro` (lecture seule) ; droits posés par `grants.sql` ;
  mot de passe `_owner` uniquement dans l'environnement GitHub `production`
- Seeder de bootstrap idempotent : crée l'utilisateur unique (`APP_OWNER_USERNAME`,
  `APP_OWNER_PASSWORD`) et garantit les 14 genres, exécuté à chaque déploiement
- Route serveur Nitro (proxy) : le navigateur ne parle qu'au frontend, toutes les
  requêtes `/api/**` sont relayées au backend avec un en-tête `X-Api-Key`
- HTTP Basic Auth sur tout le frontend (identifiants en variables d'environnement,
  obligatoires en production) ; `X-Api-Key` exigé par le backend en production
- `GET /health` public, sans information sensible
- En-têtes de sécurité, CORS en liste blanche, `npm audit` et gitleaks bloquants en CI,
  dependabot
- Workflow GitHub `deploy-backend.yml` : déploiement par SSH/rsync, releases datées et
  lien symbolique `current`, migrations puis bootstrap à chaque déploiement
- Frontend déployé par l'intégration Git native de Vercel
- Variables d'environnement configurées séparément sur chaque plateforme, jamais versionnées
- Rédaction de `docs/DEPLOIEMENT.md`

Terminé quand :
- L'application est accessible en ligne : le frontend demande le Basic Auth, le backend
  refuse toute requête `/api/**` sans `X-Api-Key` valide, `GET /health` répond.
- Frontend et backend communiquent via le proxy Nitro, l'utilisateur unique existe et
  les 14 genres sont présents.
- Le backend tourne avec `_app` ; un déploiement complet par `deploy-backend.yml` réussit,
  CI de sécurité verte.

Ce qu'on apprend : déploiement Node.js sur un hébergeur mutualisé, moindre privilège
PostgreSQL, proxy serveur et secrets d'infrastructure, CI/CD avec GitHub Actions.

---

## Phases 2 et 3

Voir `CAHIER_DES_CHARGES.md` section 12. Détail par étape à rédiger au démarrage de
chaque phase.
