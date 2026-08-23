# roadmap.md - Le Fil des Chapitres

> Détail des étapes de développement. Chaque étape correspond à une ligne de la roadmap
> haut niveau du `CAHIER_DES_CHARGES.md` (section 12). Une branche par étape, fusion
> uniquement quand le critère "Terminé quand" est vérifié. Contexte général du projet :
> voir `CLAUDE.md`.

---

## Vue d'ensemble - Phase 1 (MVP, version 0.1.0)

| # | Étape | Branche |
|---|---|---|
| 1 | Mise en place du projet (Docker local) | `chore/setup-project` |
| 2 | Schéma de base de données et migrations | `feature/database-schema` |
| 3 | API REST : CRUD webtoons (catalogue) | `feature/api-webtoons` |
| 4 | API REST : liste de lecture et statistiques | `feature/api-user-list` |
| 5 | Design system (composants, charte graphique) | `feature/design-system` |
| 6 | Interface : catalogue (liste + fiche détail) | `feature/catalogue-ui` |
| 7 | Interface : formulaires d'ajout et de modification | `feature/webtoons-forms` |
| 8 | Interface : liste de lecture (filtres, statuts) | `feature/reading-list-ui` |
| 9 | Interface : mise à jour rapide de la progression | `feature/progress-quick-update` |
| 10 | Interface : statistiques basiques | `feature/stats-ui` |
| 11 | Déploiement (Render, Neon, Vercel, UptimeRobot) | `deploy/production-setup` |

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
5. Fusionner dans `dev`. Ne jamais fusionner dans `main` sans validation explicite de Mathis.
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
- Initialisation AdonisJS 6 dans `backend/` (starter `api`, Lucid, PostgreSQL)
- Initialisation Nuxt 3 + TypeScript dans `frontend/`
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

### Étape 11 - Déploiement (Render, Neon, Vercel, UptimeRobot)

**Branche :** `deploy/production-setup`
**Dépend de :** Étapes 1 à 10 terminées

Objectif : rendre l'application accessible en ligne, conformément à `CLAUDE.md` section 11.

Contenu :
- Backend sur Render, base sur Neon, frontend sur Vercel
- CORS configuré pour le domaine Vercel
- Migrations automatiques au démarrage sur Render
- Variables d'environnement configurées séparément sur chaque plateforme
- UptimeRobot configuré contre le cold start

Terminé quand :
- L'application est accessible en ligne, frontend et backend communiquent correctement,
  UptimeRobot ping actif.

---

## Phases 2 et 3

Voir `CAHIER_DES_CHARGES.md` section 12. Détail par étape à rédiger au démarrage de
chaque phase.
