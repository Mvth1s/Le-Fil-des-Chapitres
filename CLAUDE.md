# CLAUDE.md - Le Fil des Chapitres

> Contexte permanent du projet. Ce fichier est chargé dans chaque session Claude Code.
> Le garder court et factuel. Les détails vont dans `CAHIER_DES_CHARGES.md` et `roadmap.md`.

---

## 1. Le projet en une phrase

Application web personnelle de suivi de lecture de webtoons : un catalogue global de titres
et une liste de lecture individuelle avec progression, statuts et statistiques.

Double objectif : outil réellement utilisé au quotidien, et support d'apprentissage de la stack.

**Auteur unique et utilisateur unique :** Mathis AGUADO (développeur junior).
Licence MIT. Version courante : 0.1.0 (en développement).

---

## 2. Stack

| Couche | Techno | Version |
|---|---|---|
| Frontend | Nuxt (Vue 3) | 4.x |
| Backend | AdonisJS | 6.x |
| ORM | Lucid | 21.x |
| Base de données | PostgreSQL | 16.x |
| Langage | TypeScript | 5.x |
| Dev local | Docker + Docker Compose | - |

Pas de React, pas de Prisma, pas de NestJS. Ces choix ont été arbitrés et sont fermes.

---

## 3. Structure du dépôt

```
/
├── frontend/          Nuxt 4
├── backend/           AdonisJS 6
├── docker-compose.yml
├── CLAUDE.md
├── CAHIER_DES_CHARGES.md
├── roadmap.md
├── README.md
└── .claude/
    └── agents/        Sous-agents spécialisés
```

---

## 4. Règles d'architecture non négociables

1. **Séparation catalogue / progression.** La table `webtoons` contient les données du titre
   (partagées, indépendantes de tout utilisateur). La progression de lecture vit exclusivement
   dans la table de jonction `user_webtoons`. Ne jamais ajouter de colonne `user_id`,
   `chapters_read`, `status` ou `rating` directement sur `webtoons`.
2. **Backend avant frontend.** Aucune page Nuxt n'est écrite tant que les endpoints de l'étape
   correspondante ne répondent pas correctement en test manuel (Postman / Insomnia / Thunder Client).
3. **Multi-utilisateurs anticipé, pas implémenté.** Le schéma est prêt (table `users`,
   contrainte unique sur `user_webtoons(user_id, webtoon_id)`), mais l'authentification est
   hors périmètre de la phase 1. Ne pas ajouter de JWT, de middleware d'auth ou de page de login.
4. **TypeScript partout.** Pas de fichier `.js` dans `frontend/` ni `backend/`.
5. **Validation systématique côté serveur** avant tout accès à la base (validators AdonisJS).

---

## 5. Schéma de base de données

Cinq tables, clés primaires en UUID, colonnes en `snake_case`.

| Table | Rôle | Points clés |
|---|---|---|
| `users` | Comptes | Un seul enregistrement en phase 1. Mot de passe hashé bcrypt. |
| `webtoons` | Catalogue global | `title` UNIQUE NOT NULL, `author` NOT NULL, `chapters_total` nullable. |
| `genres` | Référentiel | 14 genres prédéfinis insérés par seeder. `name` et `slug` UNIQUE. |
| `webtoon_genres` | Jonction many-to-many | PK composite (`webtoon_id`, `genre_id`). |
| `user_webtoons` | Liste de lecture | UNIQUE (`user_id`, `webtoon_id`). Cascade depuis `webtoons`. |

Statuts autorisés (`user_webtoons.status`) :
`reading`, `completed`, `on_hold`, `dropped`, `plan_to_read`.

Règle métier : si `chapters_read` atteint `chapters_total`, le statut passe automatiquement
à `completed`. `chapters_read` ne doit jamais dépasser `chapters_total` quand ce dernier
n'est pas NULL.

---

## 6. Conventions de code

**Base de données :** `snake_case` pour tables et colonnes. Tables au pluriel.

**Modèles Lucid :** classe au singulier PascalCase (`UserWebtoon`), propriétés en `camelCase`,
mapping automatique via `@column({ columnName: 'chapters_read' })` si besoin.

**Controllers AdonisJS :** un controller par ressource, nom au pluriel
(`WebtoonsController`, `UserListController`, `StatsController`).
Méthodes RESTful : `index`, `show`, `store`, `update`, `destroy`.

**Validators :** un fichier par action de création ou de mise à jour, dans `app/validators/`.

**Composants Vue :** PascalCase, préfixe `App` pour les composants du design system
(`AppButton`, `AppCard`, `AppBadge`, `AppInput`, `AppSelect`, `AppNavbar`).
Un composant par fichier, `<script setup lang="ts">`.

**Réponses API :** JSON uniquement. Codes HTTP corrects (201 à la création, 204 à la
suppression, 422 sur erreur de validation, 404 sur ressource absente).

---

## 7. Endpoints de référence

```
GET    /api/webtoons
GET    /api/webtoons/:id
POST   /api/webtoons
PUT    /api/webtoons/:id
DELETE /api/webtoons/:id

GET    /api/genres

GET    /api/user/list
POST   /api/user/list
PUT    /api/user/list/:id
PATCH  /api/user/list/:id/progress
DELETE /api/user/list/:id

GET    /api/stats
```

Toute modification de cette liste doit être répercutée dans `CAHIER_DES_CHARGES.md` section 10.

---

## 8. Charte graphique

Style : minimaliste, doux, éditorial, chaleureux.

**Polices** (Google Fonts) :
- Dancing Script : logo, navbar, grands titres (H1)
- Playfair Display : titres de section, cartes, corps de texte, badges

**Palette :**

| Variable CSS | Hex | Usage |
|---|---|---|
| `--color-primary` | `#8B9B6A` | Vert olive, actions principales |
| `--color-blue` | `#8FAEC5` | Bleu poudré, accents secondaires |
| `--color-rose` | `#C89BA5` | Rose poudré, accents secondaires |
| `--color-beige` | `#D4C4A0` | Beige chaud, accents secondaires |
| `--color-accent` | `#C9A96E` | Fil doré, éléments de mise en valeur |
| `--color-text` | `#3D3B2F` | Texte principal |
| `--color-text-muted` | `#8B8B7A` | Texte secondaire |
| `--color-bg` | `#FAF8F4` | Fond principal |

Taille de texte minimum : 14px. Contrastes conformes WCAG AA.

Ne jamais introduire une couleur ou une police hors de cette liste sans validation explicite.

---

## 9. Git

**Branches :** `main` (stable) et `develop` (intégration). Jamais de commit direct sur `main`.
Préfixes : `feature/`, `fix/`, `style/`, `chore/`, `refactor/`, `deploy/`.

**Commits :** `type: description courte en minuscules`
Types : `feat`, `fix`, `chore`, `style`, `refactor`, `docs`, `test`, `deploy`.

Une branche par étape de la roadmap. Fusion uniquement quand la condition
"Terminé quand" de l'étape est remplie.

---

## 10. Commandes utiles

```bash
# Environnement complet
docker compose up

# Backend (depuis backend/)
node ace serve --hmr
node ace migration:run
node ace migration:rollback
node ace db:seed
node ace make:controller Webtoons
node ace make:validator webtoon
node ace make:model Webtoon -m

# Frontend (depuis frontend/)
npm run dev
npm run build
```

---

## 11. Hébergement

Solution transitoire sur offres gratuites, en attendant un homelab ou un VPS.

| Service | Plateforme | Points d'attention |
|---|---|---|
| Frontend | Vercel | Variable `NUXT_PUBLIC_API_BASE` à pointer vers Render |
| Backend | Render | Cold start, ping UptimeRobot toutes les 5 minutes |
| Base de données | Neon | Choisi contre Render Postgres à cause de la suppression auto à 30 jours |
| Monitoring | UptimeRobot | Anti cold start et surveillance de santé |

Contraintes à ne jamais oublier :
- **Système de fichiers éphémère sur Render.** Aucun upload d'image en local ne survit à un
  redéploiement. La fonctionnalité d'upload de couverture reste bloquée tant qu'un stockage
  objet dédié n'est pas choisi. En attendant, `cover_url` accepte uniquement des URL externes.
- **CORS.** Le backend doit autoriser explicitement le domaine Vercel.
- **Migrations.** Exécutées automatiquement au démarrage sur Render.
- **Variables d'environnement.** Gérées séparément sur chaque plateforme, jamais versionnées.

---

## 12. Mode de collaboration attendu

Claude Code écrit le code. Mathis valide, comprend et décide.

- **Exécuter, puis expliquer.** Annoncer brièvement l'intention, produire le code, puis
  expliciter les décisions non triviales. Le projet est un support d'apprentissage :
  tout fichier produit doit être compréhensible par son auteur.
- **S'arrêter sur les choix structurants.** Ajout de dépendance, choix d'un starter ou
  d'un module, changement de schéma, modification d'un endpoint existant : demander avant.
- **Une étape à la fois.** Ne jamais enchaîner sur l'étape suivante de la roadmap, même si
  la précédente se termine vite.
- **Signaler les antipatterns** plutôt que de les contourner silencieusement.
- **Poser une question** en cas d'ambiguïté au lieu de deviner.
- **Commenter les fichiers structurants** (docker-compose, migrations, logique métier),
  pas le code trivial.
- Vocabulaire français pour les explications, anglais pour le code, les noms de variables
  et les messages de commit.

---

## 13. Interdits

- Committer un fichier `.env` ou une chaîne de connexion en clair.
- Lancer `migration:fresh`, `migration:reset` ou `db:wipe` sur la base Neon.
- Pousser directement sur `main`.
- Ajouter une dépendance sans l'annoncer et la justifier.
- Refactoriser du code hors du périmètre de la demande.
- Utiliser des tirets cadratins ou des caractères invisibles dans les fichiers générés.
- Modifier `CAHIER_DES_CHARGES.md` ou `roadmap.md` sans demande explicite.

---

## 14. Sous-agents disponibles

| Agent | Quand l'utiliser |
|---|---|
| `backend-adonisjs` | Migrations, modèles Lucid, controllers, validators, endpoints |
| `frontend-nuxt` | Pages Nuxt, composants Vue, design system, appels API côté client |
| `deploiement` | Docker, Render, Neon, Vercel, UptimeRobot, variables d'environnement, CORS |
| `code-reviewer` | Relecture avant commit. Lecture seule, ne modifie jamais le code |
| `docs-keeper` | Mise à jour de la documentation après une étape terminée |

---

## 15. Documents de référence

- `CAHIER_DES_CHARGES.md` : périmètre, user stories, schéma détaillé, charte graphique complète
- `roadmap.md` : étapes de développement, conventions Git détaillées, critères de fin d'étape
- `README.md` : installation et lancement

En cas de contradiction entre ce fichier et le cahier des charges, le cahier des charges
fait foi. Signaler la contradiction plutôt que de trancher seul.
