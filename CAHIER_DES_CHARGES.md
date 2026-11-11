# 📖 Cahier des Charges — Le Fil des Chapitres

> Application web de suivi et gestion de lecture de webtoons.

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Contexte et motivations](#2-contexte-et-motivations)
3. [Objectifs](#3-objectifs)
4. [Public cible](#4-public-cible)
5. [Périmètre du projet](#5-périmètre-du-projet)
6. [Fonctionnalités détaillées](#6-fonctionnalités-détaillées)
7. [Architecture technique](#7-architecture-technique)
8. [Schéma de base de données](#8-schéma-de-base-de-données)
9. [Design et charte graphique](#9-design-et-charte-graphique)
10. [Structure de l'application](#10-structure-de-lapplication)
11. [Exigences non-fonctionnelles](#11-exigences-non-fonctionnelles)
12. [Roadmap](#12-roadmap)
13. [Glossaire](#13-glossaire)

---

## 1. Présentation du projet

| Champ | Détail |
|---|---|
| **Nom** | Le Fil des Chapitres |
| **Type** | Application web full-stack |
| **Version actuelle** | 0.1.1 (en développement) |
| **Licence** | MIT |
| **Auteur** | Mvth1s |
| **Dépôt** | GitHub (privé / public) |

### En une phrase

**Le Fil des Chapitres** est une application web personnelle permettant de suivre, organiser et gérer sa liste de lecture de webtoons, avec un catalogue global de titres et une progression de lecture individuelle.

---

## 2. Contexte et motivations

### Qu'est-ce qu'un webtoon ?

Un **webtoon** est une bande dessinée numérique, généralement d'origine coréenne, conçue pour être lue verticalement sur smartphone ou navigateur web. Contrairement aux mangas ou comics, les webtoons sont publiés en épisodes appelés **chapitres**, souvent de manière hebdomadaire, sur des plateformes comme Webtoon, Tapas, Manhwa ou des sites de scanlation.

### Pourquoi ce projet ?

Les outils de suivi de lecture existants (MyAnimeList, AniList, Kitsu, etc.) sont principalement orientés **anime et manga**. Ils supportent mal ou partiellement les webtoons : titres manquants, métadonnées incomplètes, impossibilité d'ajouter des œuvres non référencées.

L'objectif est de créer un outil **sur-mesure**, auto-hébergeable, centré uniquement sur les webtoons, avec la liberté d'ajouter n'importe quel titre — même ceux non référencés sur des plateformes officielles.

---

## 3. Objectifs

### Objectifs principaux

- ✅ Permettre de **gérer un catalogue global** de webtoons (ajout, modification, suppression)
- ✅ Permettre de **suivre sa progression de lecture** (chapitres lus, statut, notes)
- ✅ Offrir une **interface claire et agréable** pour consulter sa liste de lecture
- ✅ Être **auto-hébergeable** via Docker pour une utilisation personnelle

### Objectifs secondaires

- 🔄 Préparer l'architecture pour un éventuel **passage en multi-utilisateurs**
- 🔄 Offrir des **statistiques de lecture** (nombre de chapitres lus, genres favoris, etc.)
- 🔄 Permettre l'**import/export** de sa liste de lecture

### Ce que le projet n'est PAS

- ❌ Ce n'est pas un lecteur de webtoons (il n'affiche pas les pages des chapitres)
- ❌ Ce n'est pas un agrégateur de flux (il ne récupère pas automatiquement les nouveaux chapitres)
- ❌ Ce n'est pas un réseau social (pas de partage, pas de commentaires publics)

---

## 4. Public cible

### Utilisateur principal (Phase 1 — Mono-utilisateur)

L'application est développée **pour un usage personnel**. L'utilisateur est le développeur lui-même. Il n'y a pas de système d'inscription ou de gestion de compte complexe dans cette première phase.

**Profil :**
- Lecteur régulier de webtoons
- À l'aise avec l'informatique
- Dispose d'un serveur ou d'une machine pour auto-héberger l'application

### Utilisateurs futurs (Phase 2 — Multi-utilisateurs)

L'architecture est pensée dès le départ pour supporter plusieurs utilisateurs avec leurs propres listes de lecture indépendantes, sans que cela nécessite une refonte complète.

---

## 5. Périmètre du projet

### Inclus dans la Phase 1 (MVP)

| Fonctionnalité | Description |
|---|---|
| Catalogue global | Créer, modifier et supprimer des webtoons dans une bibliothèque partagée |
| Liste de lecture | Associer un webtoon à sa liste avec progression et statut |
| Recherche & filtres | Rechercher et filtrer les webtoons par genre, statut, auteur |
| Interface responsive | Utilisable sur desktop et mobile |
| Déploiement Docker | Application conteneurisée, prête à l'emploi |

### Exclu de la Phase 1

| Fonctionnalité | Raison |
|---|---|
| Authentification multi-utilisateurs | Complexité non nécessaire pour un usage solo |
| Notifications de nouveaux chapitres | Nécessite un scraping externe |
| Import automatique depuis Webtoon/Tapas | Dépend d'API tierces instables |
| Application mobile native | Hors périmètre |

---

## 6. Fonctionnalités détaillées

> Les fonctionnalités sont décrites sous forme de **User Stories** : "En tant que [rôle], je veux [action] afin de [bénéfice]."

---

### 6.1 Catalogue global de webtoons

#### US-01 — Ajouter un webtoon au catalogue

> En tant qu'utilisateur, je veux ajouter un nouveau webtoon au catalogue afin de pouvoir ensuite le suivre dans ma liste de lecture.

**Champs requis :**
- Titre (obligatoire)
- Auteur (obligatoire)
- Genres (optionnel, sélection multiple parmi une liste prédéfinie + possibilité d'en créer)
- Nombre total de chapitres (optionnel, modifiable ultérieurement)
- Lien de lecture (optionnel)
- Image de couverture (optionnel, URL ou upload)
- Description / Synopsis (optionnel)

**Règles métier :**
- Le titre doit être unique dans le catalogue
- Au moins un champ (titre) doit être renseigné pour créer l'entrée

---

#### US-02 — Modifier un webtoon du catalogue

> En tant qu'utilisateur, je veux modifier les informations d'un webtoon existant afin de les maintenir à jour (ex : nouveau nombre de chapitres total).

**Champs modifiables :** tous les champs définis lors de la création.

---

#### US-03 — Supprimer un webtoon du catalogue

> En tant qu'utilisateur, je veux supprimer un webtoon du catalogue afin de le retirer définitivement.

**Règles métier :**
- La suppression d'un webtoon du catalogue supprime également toutes les entrées de lecture associées (suppression en cascade)
- Une confirmation explicite est demandée avant suppression

---

#### US-04 — Consulter le catalogue

> En tant qu'utilisateur, je veux consulter la liste de tous les webtoons du catalogue afin d'avoir une vue d'ensemble des titres disponibles.

**Fonctionnalités de l'affichage :**
- Vue grille (cartes visuelles avec couverture)
- Vue liste (tableau compact)
- Tri par : titre (A-Z), date d'ajout, nombre de chapitres
- Filtres par : genre, statut de lecture, auteur

---

### 6.2 Liste de lecture personnelle

#### US-05 — Ajouter un webtoon à ma liste de lecture

> En tant qu'utilisateur, je veux ajouter un webtoon du catalogue à ma liste de lecture afin de suivre ma progression.

**Champs associés à la lecture :**
- Statut (obligatoire) : `En cours` / `Terminé` / `En pause` / `Abandonné` / `À lire`
- Chapitres lus (obligatoire, par défaut 0)
- Note personnelle sur 10 (optionnel)
- Commentaire / avis personnel (optionnel)
- Date de début de lecture (optionnel, auto-remplie)
- Date de fin de lecture (optionnel, auto-remplie si statut = Terminé)

---

#### US-06 — Mettre à jour ma progression

> En tant qu'utilisateur, je veux mettre à jour rapidement le nombre de chapitres lus afin de garder ma progression à jour sans effort.

**Fonctionnalités :**
- Bouton `+1 chapitre` directement sur la carte (sans ouvrir un formulaire)
- Champ de saisie directe du numéro de chapitre actuel
- Mise à jour automatique du statut si `chapitres lus = chapitres totaux` → passe à `Terminé`

---

#### US-07 — Modifier les informations de lecture

> En tant qu'utilisateur, je veux modifier le statut, la note ou le commentaire d'un webtoon de ma liste afin de les maintenir à jour.

**Fonctionnalités :**
- Les dates de début et de fin, la note et le commentaire peuvent aussi être modifiés ou effacés
- Note de 0 à 10 par pas de 0,5

---

#### US-08 — Retirer un webtoon de ma liste de lecture

> En tant qu'utilisateur, je veux retirer un webtoon de ma liste de lecture sans le supprimer du catalogue afin de gérer ma liste sans perdre les informations du titre.

---

### 6.3 Recherche et filtres

#### US-09 — Rechercher un webtoon

> En tant qu'utilisateur, je veux rechercher un webtoon par son titre ou son auteur afin de le retrouver rapidement dans le catalogue ou dans ma liste.

**Fonctionnalités :**
- Recherche en temps réel (au fur et à mesure de la saisie)
- Recherche insensible à la casse et aux accents

---

#### US-10 — Filtrer et trier

> En tant qu'utilisateur, je veux filtrer ma liste de lecture par statut, genre ou note afin d'afficher uniquement les webtoons qui m'intéressent.

**Filtres disponibles :**
- Statut de lecture (En cours, Terminé, En pause, Abandonné, À lire)
- Genre(s)
- Note (ex : uniquement les webtoons notés 8 ou plus)

**Tris disponibles :**
- Titre (A-Z / Z-A)
- Date d'ajout (récent / ancien)
- Note (croissant / décroissant)
- Progression (% de chapitres lus)

---

### 6.4 Statistiques (Phase 1 — basique)

#### US-11 — Consulter ses statistiques de lecture

> En tant qu'utilisateur, je veux voir un résumé de mes statistiques afin de visualiser mon activité de lecture.

**Statistiques affichées :**
- Nombre total de webtoons dans la liste
- Répartition par statut (graphique)
- Total de chapitres lus
- Genres les plus lus (top 3)
- Webtoons les mieux notés (top 5)

---

## 7. Architecture technique

### Vue d'ensemble

```
┌─────────────────────────────────────────────┐
│                   CLIENT                    │
│              Nuxt 4 (Vue 3)                 │
│         Interface utilisateur web           │
└─────────────────┬───────────────────────────┘
                  │ HTTP / REST API (JSON)
┌─────────────────▼───────────────────────────┐
│                  SERVEUR                    │
│                AdonisJS 7                   │
│        API REST + Logique métier            │
└─────────────────┬───────────────────────────┘
                  │ Requêtes SQL (via Lucid ORM)
┌─────────────────▼───────────────────────────┐
│              BASE DE DONNÉES                │
│               PostgreSQL 16                 │
│           Stockage persistant               │
└─────────────────────────────────────────────┘

      En local, tous les services tournent dans Docker.
      En production : Vercel (frontend), alwaysdata (backend et PostgreSQL).
```

### Stack technologique

| Couche | Technologie | Version | Rôle |
|---|---|---|---|
| **Frontend** | Nuxt 4 | 4.x | Framework Vue.js avec SSR, routing, et gestion d'état |
| **UI** | Vue 3 | 3.x | Composants réactifs |
| **Backend** | AdonisJS | 7.x (Node.js 24) | Framework Node.js MVC, gestion des routes API |
| **ORM** | Lucid (natif Adonis) | 22.x | Communication avec PostgreSQL en TypeScript |
| **Base de données** | PostgreSQL | 16.x | Stockage relationnel des données |
| **Conteneurisation** | Docker + Docker Compose | — | Déploiement et isolation des services |
| **Langage** | TypeScript | 5.x | Typage statique côté frontend et backend |

### Justification des choix

**Nuxt 4** — SSR natif, routing intégré, excellent support TypeScript, adapté à une application de taille moyenne avec des pages de listes et des formulaires.

**AdonisJS** — Framework structuré (MVC) qui impose de bonnes pratiques sans être aussi complexe que NestJS. Inclut nativement : ORM (Lucid), validation, gestion des migrations, authentification. Idéal pour un développeur junior qui veut construire proprement.

**Lucid ORM** — ORM natif d'AdonisJS. Intégré nativement, pas besoin d'un outil supplémentaire comme Prisma. Fait exactement ce dont le projet a besoin.

**PostgreSQL** — Base de données relationnelle robuste, référence de l'industrie, parfaitement adaptée aux données structurées du projet (webtoons, genres, listes).

**Docker + Docker Compose** — Permet de lancer l'application complète (frontend, backend, base de données) avec une seule commande, sur n'importe quelle machine. Indispensable pour l'auto-hébergement.

### Hébergement de production

| Service | Plateforme | Détail |
|---|---|---|
| Frontend | Vercel Hobby | Région `cdg1`, déploiement par l'intégration Git native |
| Backend | alwaysdata, offre Free | Site Node.js (1 Go disque, 256 Mo RAM, usage personnel non lucratif) |
| Base de données | PostgreSQL alwaysdata | Même compte que le backend |

**Protection de l'instance publique.** Le navigateur ne parle qu'au frontend. Toutes les requêtes `/api/**` passent par une route serveur Nitro (proxy) qui les relaie au backend en ajoutant un en-tête `X-Api-Key`. Le frontend entier est protégé par HTTP Basic Auth. Le backend exige `X-Api-Key` en production. `GET /health` est public et n'expose aucune information sensible.

> Ce n'est pas une authentification utilisateur : pas de JWT, de session ni de page de login. L'authentification réelle reste en Phase 3.

Détails opérationnels : `docs/DEPLOIEMENT.md` et `docs/SECURITE.md`.

---

## 8. Schéma de base de données

### Modèle conceptuel

Le projet repose sur une séparation claire entre :
- Le **catalogue global** : les webtoons qui existent indépendamment de tout utilisateur
- La **liste de lecture** : la relation entre un utilisateur et un webtoon, avec sa progression personnelle

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    users    │       │  user_webtoons   │       │  webtoons   │
│─────────────│       │──────────────────│       │─────────────│
│ id          │◄──────│ user_id (FK)     │──────►│ id          │
│ username    │       │ webtoon_id (FK)  │       │ title       │
│ password    │       │ status           │       │ author      │
│ created_at  │       │ chapters_read    │       │ description │
│ updated_at  │       │ rating           │       │ cover_url   │
└─────────────┘       │ comment          │       │ chapters_total│
                      │ started_at       │       │ link        │
                      │ finished_at      │       │ created_at  │
                      │ created_at       │       │ updated_at  │
                      │ updated_at       │       └──────┬──────┘
                      └──────────────────┘              │
                                                        │ many-to-many
                                              ┌─────────▼──────────┐
                                              │  webtoon_genres    │
                                              │────────────────────│
                                              │ webtoon_id (FK)    │
                                              │ genre_id (FK)      │
                                              └─────────┬──────────┘
                                                        │
                                              ┌─────────▼──────────┐
                                              │      genres        │
                                              │────────────────────│
                                              │ id                 │
                                              │ name               │
                                              │ slug               │
                                              └────────────────────┘
```

### Détail des tables

#### Table `users`

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PK, NOT NULL | Identifiant unique |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Nom d'utilisateur |
| `password` | VARCHAR(255) | NOT NULL | Mot de passe hashé (bcrypt) |
| `created_at` | TIMESTAMP | NOT NULL | Date de création |
| `updated_at` | TIMESTAMP | NOT NULL | Date de dernière modification |

> **Note Phase 1 :** En mono-utilisateur, un seul enregistrement existera dans cette table. La structure est prête pour le multi-utilisateurs. En production, cet utilisateur unique est créé par un seeder de bootstrap idempotent (`APP_OWNER_USERNAME`, `APP_OWNER_PASSWORD`), qui garantit aussi les 14 genres et s'exécute à chaque déploiement.

---

#### Table `webtoons`

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PK, NOT NULL | Identifiant unique |
| `title` | VARCHAR(255) | NOT NULL, UNIQUE | Titre du webtoon |
| `author` | VARCHAR(255) | NOT NULL | Nom de l'auteur |
| `description` | TEXT | NULLABLE | Synopsis ou description |
| `cover_url` | VARCHAR(500) | NULLABLE | URL de l'image de couverture |
| `chapters_total` | INTEGER | NULLABLE | Nombre total de chapitres (NULL si en cours de publication) |
| `link` | VARCHAR(500) | NULLABLE | Lien vers la plateforme de lecture |
| `created_at` | TIMESTAMP | NOT NULL | Date d'ajout au catalogue |
| `updated_at` | TIMESTAMP | NOT NULL | Date de dernière modification |

---

#### Table `genres`

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PK, NOT NULL | Identifiant unique |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Nom du genre (ex : "Romance") |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | Version URL du nom (ex : "romance") |

**Genres prédéfinis :** Action, Romance, Fantasy, Horreur, Comédie, Drame, Thriller, Science-Fiction, Tranche de vie, Isekai, Sports, Mystère, Historique, Surnaturel

---

#### Table `webtoon_genres` (table de jonction)

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `webtoon_id` | UUID | FK → webtoons.id | Référence au webtoon |
| `genre_id` | UUID | FK → genres.id | Référence au genre |

> Clé primaire composite : (`webtoon_id`, `genre_id`)

---

#### Table `user_webtoons` (liste de lecture)

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | UUID | PK, NOT NULL | Identifiant unique |
| `user_id` | UUID | FK → users.id, NOT NULL | Référence à l'utilisateur |
| `webtoon_id` | UUID | FK → webtoons.id, NOT NULL | Référence au webtoon |
| `status` | ENUM | NOT NULL | `reading` / `completed` / `on_hold` / `dropped` / `plan_to_read` |
| `chapters_read` | INTEGER | NOT NULL, DEFAULT 0 | Nombre de chapitres lus |
| `rating` | DECIMAL(3,1) | NULLABLE | Note de 0.0 à 10.0 |
| `comment` | TEXT | NULLABLE | Avis ou commentaire personnel |
| `started_at` | DATE | NULLABLE | Date de début de lecture |
| `finished_at` | DATE | NULLABLE | Date de fin de lecture |
| `created_at` | TIMESTAMP | NOT NULL | Date d'ajout à la liste |
| `updated_at` | TIMESTAMP | NOT NULL | Date de dernière mise à jour |

> Contrainte UNIQUE sur (`user_id`, `webtoon_id`) — un utilisateur ne peut ajouter un webtoon qu'une seule fois à sa liste.

---

## 9. Design et charte graphique

### Identité visuelle

| Élément | Détail |
|---|---|
| **Logo** | Pile de livres stylisés traversés par un fil doré sinueux |
| **Slogan visuel** | Webtoon Tracker |
| **Style général** | Minimaliste, doux, éditorial, chaleureux |

### Palette de couleurs

Tokens définis dans `frontend/app/assets/css/main.css`, issus du UI kit.

**Teintes de la charte**

| Token | Hex | Rôle |
|---|---|---|
| `--color-primary` | `#8B9B6A` | Vert olive, actions principales |
| `--color-blue` | `#8FAEC5` | Bleu poudré |
| `--color-rose` | `#C89BA5` | Rose poudré |
| `--color-beige` | `#D4C4A0` | Beige chaud |
| `--color-accent` | `#C9A96E` | Fil doré |
| `--color-text` | `#3D3B2F` | Texte principal |
| `--color-text-muted` | `#8B8B7A` | Gris chaud (3,26:1 sur le fond : jamais pour du texte) |
| `--color-bg` | `#FAF8F4` | Fond principal |

**Nuances et teintes**

| Famille | Nuance sombre (survol, appui) | Teinte claire (surfaces, tags) |
|---|---|---|
| Primary | `#7A8A59` | `#E4E9D8` |
| Blue | `#7E9DB4` | `#E0E9F0` |
| Rose | `#B78A94` | `#F1DFE3` |
| Beige | `#C3B38F` | `#F0E9D6` |
| Accent | `#B4955B` | `#EFE2C5` |

**Neutres chauds**

| Token | Hex | Rôle |
|---|---|---|
| `--color-text-soft` | `#5C5A4D` | Encre douce |
| `--color-line` | `#E6E1D4` | Lignes et bordures décoratives |
| `--color-line-soft` | `#EFEAE0` | Lignes discrètes |
| `--color-bg-sunken` | `#F4EFE5` | Fond en creux |
| `--color-surface` | `#FFFFFF` | Surface des cartes |

**Tokens d'accessibilité** (écarts volontaires au UI kit, qui échoue au contraste AA)

| Token | Hex | Ratio | Usage |
|---|---|---|---|
| `--color-on-accent` | `#3D3B2F` | 5,03:1 sur `--color-accent` | Texte sur fond doré |
| `--color-focus` | `#8C6E35` | 4,5:1 sur `--color-bg` | Contour de focus (2 px) |
| `--color-field-border` | `#8B8B7A` | 3,26:1 sur `--color-bg` | Bordure des champs |

### Couleurs de statut

Pastille décorative, le libellé reste en `--color-text`.

| Statut | Couleur |
|---|---|
| `reading` | Sauge (`--color-primary`) |
| `completed` | Bleu (`--color-blue`) |
| `on_hold` | Beige (`--color-beige`) |
| `dropped` | Rose (`--color-rose`) |
| `plan_to_read` | Gris (`--color-text-muted`) |

### Couleurs de genre

Cinq tons (sauge, bleu, rose, beige, neutre), chacun un couple fond et texte à plus de 4,5:1. Les 14 genres du référentiel y sont rattachés ; tout genre inconnu prend le ton neutre.

| Ton | Genres |
|---|---|
| Sauge | Action, Comédie, Sports, Historique |
| Bleu | Thriller, Mystère, Surnaturel, Science-Fiction |
| Rose | Romance, Horreur, Isekai |
| Beige | Fantasy, Drame, Tranche de vie |
| Neutre | Repli pour tout autre genre |

### Couvertures générées

Sans image, la couverture est un dégradé suivi d'une pile de livres. Neuf dégradés sont construits sur les teintes de la charte (sauge, bleu, rose, beige, quatre mélanges et un dégradé nuit dorée). Le choix est déterministe : un hash de l'identifiant du webtoon donne toujours le même dégradé. `cover_url` n'accepte que des URL externes.

### Typographie

| Usage | Police | Style | Taille |
|---|---|---|---|
| Logo / Nom de l'app | Dancing Script | Bold 700 | 28–52px |
| Grands titres de page (H1) | Dancing Script | Bold 700 | 40–48px |
| Titres de section (H2) | Playfair Display | Bold 700 | 24–28px |
| Titres de carte (H3) | Playfair Display | SemiBold 600 | 18–20px |
| Corps de texte, labels | Playfair Display | Regular 400 | 14–16px |
| Badges, tags, statuts | Playfair Display | Italic 400 | 14px |

Échelle des tokens : affichage 52px, H1 44px, H2 26px, H3 19px, corps 15px, petit texte et tags 14px. La taille minimale est 14px partout, tags et badges compris (le UI kit prévoit 12 et 13px).

### Polices auto-hébergées

Dancing Script et Playfair Display (romain et italique) sont servies en woff2 variables depuis `frontend/public/fonts/`, sous licence OFL (texte joint à chaque police). Il n'y a plus d'appel à Google Fonts : la CSP impose `font-src 'self'`.

---

## 10. Structure de l'application

### Routes frontend (Nuxt 4)

| Route | Page | Description |
|---|---|---|
| `/` | Accueil / Dashboard | Vue d'ensemble : statistiques rapides, derniers webtoons ajoutés, en cours de lecture |
| `/catalogue` | Catalogue global | Liste de tous les webtoons du catalogue avec recherche et filtres |
| `/catalogue/ajouter` | Ajouter un webtoon | Formulaire d'ajout d'un nouveau webtoon au catalogue |
| `/catalogue/:id` | Fiche webtoon | Détail d'un webtoon : infos, genres, bouton "Ajouter à ma liste" |
| `/catalogue/:id/modifier` | Modifier un webtoon | Formulaire de modification d'un webtoon existant |
| `/liste` | Ma liste de lecture | Liste personnelle avec statuts, progression et filtres |
| `/statistiques` | Statistiques | Graphiques et résumés de lecture |

### Endpoints API (AdonisJS)

#### Webtoons

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/webtoons` | Liste tous les webtoons du catalogue |
| `GET` | `/api/webtoons/:id` | Détail d'un webtoon |
| `POST` | `/api/webtoons` | Créer un nouveau webtoon |
| `PUT` | `/api/webtoons/:id` | Modifier un webtoon |
| `DELETE` | `/api/webtoons/:id` | Supprimer un webtoon |

#### Liste de lecture

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/list` | Récupère la liste de lecture de l'utilisateur |
| `POST` | `/api/user/list` | Ajouter un webtoon à la liste |
| `PUT` | `/api/user/list/:id` | Modifier une entrée (statut, chapitres, note, commentaire, dates) |
| `PATCH` | `/api/user/list/:id/progress` | Mise à jour rapide de la progression (+1 chapitre) |
| `DELETE` | `/api/user/list/:id` | Retirer un webtoon de la liste |

Règles de contrat de la liste de lecture :

- `PUT` : un champ absent n'est pas modifié. `rating`, `comment`, `startedAt` et `finishedAt` acceptent `null` pour effacer la valeur.
- `rating` (`POST` et `PUT`) : entre 0 et 10, par pas de 0,5.
- `chaptersRead` (`POST`, `PUT` et `PATCH .../progress`) : entier positif ou nul, jamais supérieur à `chapters_total` quand il est défini.
- `finished_at` est renseigné automatiquement au passage au statut `completed` (y compris par atteinte de `chapters_total`), s'il n'est pas déjà fourni.

#### Genres

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/genres` | Liste tous les genres disponibles |

#### Statistiques

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Retourne les statistiques de lecture de l'utilisateur |

#### Santé

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Public, hors `/api`, sans `X-Api-Key`. `200` `{"status":"ok"}` si la base répond, `503` `{"status":"error"}` sinon. N'expose aucun détail. |

#### Protection en production

En production, toute requête `/api/**` doit porter l'en-tête `X-Api-Key` (valeur de `API_KEY` du backend), sinon `401`. Le proxy Nitro du frontend l'ajoute ; le navigateur ne la voit jamais. Hors production, si `API_KEY` est absente, la vérification est désactivée.

---

## 11. Exigences non-fonctionnelles

### Performance

- Les pages doivent se charger en **moins de 2 secondes** sur une connexion standard
- Les requêtes API doivent répondre en **moins de 500ms** pour les opérations courantes
- La recherche en temps réel doit être **debouncée** (délai de 300ms) pour éviter les requêtes excessives

### Accessibilité

- L'interface doit être utilisable sur **desktop et mobile** (design responsive)
- Les tailles de texte minimum sont de **14px** pour garantir la lisibilité
- Les contrastes de couleurs respectent les recommandations WCAG AA

### Sécurité

- Aucun secret en dur dans le code ou le dépôt : variables d'environnement uniquement
- Les mots de passe sont **hashés avec bcrypt** (jamais stockés en clair)
- Les variables sensibles sont stockées dans un fichier **`.env`** non versionné, présent dans le `.gitignore`
- Trois comptes PostgreSQL distincts : `_owner` (migrations, GRANT, bootstrap ; mot de passe uniquement dans l'environnement GitHub `production`), `_app` (DML seul, utilisé par le backend), `_ro` (lecture seule, consultation et sauvegardes)
- Instance publique protégée : proxy Nitro, HTTP Basic Auth sur le frontend, en-tête `X-Api-Key` exigé par le backend en production (voir section 7)
- En-têtes de sécurité HTTP et CORS en liste blanche
- `npm audit` et gitleaks bloquants en CI, dependabot activé
- Les entrées utilisateur sont **validées et assainies** côté serveur avant traitement
- Politique détaillée : `docs/SECURITE.md`

### Maintenabilité

- Le code est entièrement écrit en **TypeScript** (frontend et backend)
- Le projet suit une **structure de dossiers claire** et documentée
- Un fichier `README.md` explique comment installer et lancer le projet localement

### Déploiement

- L'application doit pouvoir être lancée avec la commande **`docker-compose up`**
- Les migrations de base de données doivent s'exécuter **automatiquement** au démarrage
- L'environnement de développement et de production sont séparés via des fichiers `.env` distincts
- En production, le backend est déployé par un workflow GitHub (`deploy-backend.yml`, SSH/rsync, releases et lien `current`) et le frontend par l'intégration Git de Vercel
- Les seeders de bootstrap (utilisateur unique, 14 genres) s'exécutent à chaque déploiement

---

## 12. Roadmap

### Phase 1 — MVP (Version 0.1.0)

> Objectif : avoir une application fonctionnelle pour un usage personnel solo.

- [x] Mise en place du projet (Nuxt 4 + AdonisJS + PostgreSQL + Docker)
- [x] Création du schéma de base de données et des migrations
- [x] API REST : CRUD complet sur les webtoons
- [x] API REST : gestion de la liste de lecture
- [x] Interface : catalogue (liste + fiche détail)
- [x] Interface : formulaires d'ajout et de modification
- [x] Interface : liste de lecture avec filtres et statuts
- [x] Interface : mise à jour rapide de la progression (+1 chapitre)
- [x] Interface : statistiques basiques
- [x] Design : intégration de la charte graphique (couleurs, typographies, logo)
- [x] Déploiement : configuration Docker Compose complète

### Phase 2 — Amélioration (Version 0.2.0)

- [ ] Import / Export de la liste (format CSV ou JSON)
- [ ] Image de couverture : upload local (pas seulement URL externe)
- [ ] Système de tags personnalisés en plus des genres
- [ ] Historique de lecture (dates de lecture de chaque chapitre)
- [ ] Mode sombre / clair

### Phase 3 — Multi-utilisateurs (Version 1.0.0)

- [ ] Système d'authentification complet (inscription, connexion, JWT)
- [ ] Isolation des listes de lecture par utilisateur
- [ ] Page de profil utilisateur
- [ ] Gestion des sessions et sécurité renforcée
- [ ] Déploiement sur un VPS avec reverse proxy (Nginx ou Caddy)

---

## 13. Glossaire

| Terme | Définition |
|---|---|
| **Webtoon** | Bande dessinée numérique conçue pour être lue verticalement sur écran, souvent publiée par épisodes (chapitres) |
| **Chapitre** | Un épisode d'un webtoon, équivalent à un chapitre de roman ou de manga |
| **Catalogue** | La bibliothèque globale de tous les webtoons référencés dans l'application, indépendamment de la liste de lecture d'un utilisateur |
| **Liste de lecture** | La liste personnelle d'un utilisateur, avec sa progression et ses notes sur chaque webtoon |
| **Statut** | L'état de lecture d'un webtoon pour un utilisateur : En cours, Terminé, En pause, Abandonné, À lire |
| **ORM** | Object-Relational Mapping — outil qui permet de manipuler une base de données en code (TypeScript ici) sans écrire de SQL manuellement |
| **API REST** | Interface de communication entre le frontend et le backend, via des requêtes HTTP standardisées |
| **SSR** | Server-Side Rendering — technique où les pages HTML sont générées côté serveur avant d'être envoyées au navigateur |
| **Docker** | Outil qui permet d'empaqueter une application et ses dépendances dans des conteneurs isolés et portables |
| **Migration** | Script SQL qui décrit une modification de la structure de la base de données (ajout de table, de colonne, etc.) |
| **MVP** | Minimum Viable Product — version minimale d'un produit qui contient uniquement les fonctionnalités essentielles |
| **CRUD** | Create, Read, Update, Delete — les quatre opérations de base sur des données |
| **UUID** | Identifiant unique universel, format standard pour les clés primaires en base de données |
| **Bcrypt** | Algorithme de hachage sécurisé utilisé pour stocker les mots de passe de manière irréversible |
| **Debounce** | Technique qui limite la fréquence d'exécution d'une fonction (ex : attendre que l'utilisateur ait fini de taper avant de lancer une recherche) |
| **WCAG** | Web Content Accessibility Guidelines — recommandations internationales pour l'accessibilité web |
