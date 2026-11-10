# CLAUDE.md - Le Fil des Chapitres

> Contexte permanent du projet. Ce fichier est chargé dans chaque session Claude Code.
> Le garder court et factuel. Les détails vont dans `CAHIER_DES_CHARGES.md` et `roadmap.md`.

---

## 1. Le projet en une phrase

Application web personnelle de suivi de lecture de webtoons : un catalogue global de titres
et une liste de lecture individuelle avec progression, statuts et statistiques.

Double objectif : outil réellement utilisé au quotidien, et support d'apprentissage de la stack.

**Auteur unique et utilisateur unique :** Mvth1s (développeur junior).
Licence MIT. Version courante : 0.1.0 (en développement).

---

## 2. Stack

| Couche | Techno | Version |
|---|---|---|
| Frontend | Nuxt (Vue 3) | 4.x |
| Backend | AdonisJS | 7.x |
| ORM | Lucid | 22.x |
| Runtime | Node.js | 24 LTS |
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
   **Exception (protection de l'instance publique, ce n'est pas une auth utilisateur) :**
   le navigateur ne parle qu'au frontend ; les requêtes `/api/**` passent par un proxy
   Nitro qui ajoute un en-tête `X-Api-Key` exigé par le backend en production ; le frontend
   entier est derrière une HTTP Basic Auth (identifiants en variables d'environnement).
   `GET /health` reste public. Pas de session, pas de JWT, pas de page de login.
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

**Branches :** `main` (stable) et `dev` (intégration). Jamais de commit direct sur `main`.
Préfixes : `feature/`, `fix/`, `style/`, `chore/`, `refactor/`, `deploy/`.

**Commits :** `type: description courte en minuscules`
Types : `feat`, `fix`, `chore`, `style`, `refactor`, `docs`, `test`, `deploy`.

Une branche par étape de la roadmap. Fusion uniquement quand la condition
"Terminé quand" de l'étape est remplie.

---

## 10. Commandes utiles

```bash
# Environnement complet (après cp .env.example .env et génération des valeurs)
docker compose up

# Backend (depuis backend/)
node ace serve --hmr
node ace migration:run --connection=migration      # compte _owner, seul autorisé au DDL
node ace migration:rollback --connection=migration
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

Offres gratuites, usage personnel. Guide pas à pas : `docs/DEPLOIEMENT.md`.

| Service | Plateforme | Points d'attention |
|---|---|---|
| Backend | Site Node.js alwaysdata (Free) | 256 Mo de RAM, mise en veille après 30 min sans requête, une seule instance |
| Base de données | PostgreSQL alwaysdata (même compte) | Sauvegardes de la plateforme limitées à quelques jours |
| Frontend | Vercel (Hobby), région `cdg1` | Intégration Git native, branche de production `main` |

Contraintes à ne jamais oublier :
- **Déploiement backend** par le workflow `deploy-backend.yml` (SSH + rsync, releases et
  lien `current`, migrations et `grants.sql` exécutés en `_owner`, puis redémarrage).
- **Droits de `_app`.** Ne jamais revalider les droits de l'utilisateur `_app` dans
  l'interface alwaysdata (cela réinitialise les GRANT) ; si c'est fait, relancer le workflow.
- **Pas de stockage d'images.** `cover_url` accepte uniquement des URL externes.
- **Variables d'environnement.** Gérées séparément sur chaque plateforme, jamais versionnées.

---

## 12. Mode de collaboration attendu

Claude Code écrit le code. Mvth1s valide, comprend et décide.

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

## 12 bis. Sécurité

Socle "PME", détaillé dans `docs/SECURITE.md` :
- Aucun secret en dur. Local : `.env` racine non versionné. CI : valeurs aléatoires générées
  à chaque run. Production : variables alwaysdata / Vercel et environnement GitHub
  `production`. En production, le démarrage échoue si un secret obligatoire manque.
- Trois comptes PostgreSQL : `_owner` (migrations, GRANT, bootstrap), `_app` (DML seul,
  utilisé par le backend), `_ro` (lecture seule). Le même modèle tourne en local et en CI.
- Seul le pseudo `Mvth1s` apparaît dans le dépôt.
- CI bloquante : gitleaks, `npm audit --omit=dev --audit-level=high`, actions épinglées par
  SHA, `permissions:` minimales. Dependabot hebdomadaire.

---

## 13. Interdits

- Committer un fichier `.env` ou une chaîne de connexion en clair.
- Lancer `migration:fresh`, `migration:reset` ou `db:wipe` sur la base de production alwaysdata.
- Pousser directement sur `main`.
- Ajouter une dépendance sans l'annoncer et la justifier.
- Refactoriser du code hors du périmètre de la demande.
- Utiliser des tirets cadratins ou des caractères invisibles dans les fichiers générés.
- Modifier `CAHIER_DES_CHARGES.md` ou `roadmap.md` sans demande explicite.

---

## 14. Sous-agents disponibles

Chaque agent a un rôle unique, un périmètre en écriture et des interdits communs
(voir `.claude/agents/`). Aucun agent ne fait d'opération Git ni ne touche aux dépendances.

| Agent | Rôle | Écrit dans |
|---|---|---|
| `backend-adonisjs` | Code applicatif backend | `backend/app`, `start`, `config`, `database`, config du framework |
| `frontend-nuxt` | Code applicatif frontend | `frontend/app`, `server`, `public`, `nuxt.config.ts` |
| `deploiement` | Exécution locale et livraison | compose, `docker/`, Dockerfiles, `.github/`, `.env.example` |
| `testeur-backend` | Tests fonctionnels Japa | `backend/tests` |
| `testeur-frontend` | Tests Vitest | `frontend/tests` |
| `docs-keeper` | Documentation | `*.md` racine (sauf CLAUDE.md), `docs/` (sauf sécurité, audits, release) |
| `gardien-securite-doc` | Documentation de sécurité | `docs/SECURITE.md` |
| `code-reviewer` | Relecture avant PR | rien (lecture seule) |
| `auditeur-securite` | Audit du socle de sécurité | `docs/audits/securite-*.md` |
| `auditeur-fonctionnel` | Comparaison appli / user stories | `docs/release-*.md` (section écarts) |
| `verificateur-hypotheses` | Vérification sur sources officielles | `docs/release-*.md` (section hypothèses) |

---

## 15. Documents de référence

- `CAHIER_DES_CHARGES.md` : périmètre, user stories, schéma détaillé, charte graphique complète
- `roadmap.md` : étapes de développement, conventions Git détaillées, critères de fin d'étape
- `README.md` : installation et lancement
- `docs/DEPLOIEMENT.md`, `docs/SECURITE.md` : mise en production et socle de sécurité

En cas de contradiction entre ce fichier et le cahier des charges, le cahier des charges
fait foi. Signaler la contradiction plutôt que de trancher seul.
