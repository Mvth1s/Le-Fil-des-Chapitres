<div align="center">

<img src="logo/lfdc_logo_banner.png" alt="Le Fil des Chapitres" width="480">

# 📖 Le Fil des Chapitres

**Suivez, organisez et gérez votre lecture de webtoons.**

[![Version](https://img.shields.io/badge/version-0.1.0--dev-blue?style=flat-square)](https://github.com/Mvth1s/Le-Fil-des-Chapitres)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-green?style=flat-square)](LICENSE)
[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.x-00DC82?style=flat-square&logo=nuxt.js)](https://nuxt.com)
[![AdonisJS](https://img.shields.io/badge/AdonisJS-7.x-5A45FF?style=flat-square)](https://adonisjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com)

</div>

---

## 📌 Présentation

**Le Fil des Chapitres** est une application web personnelle pour suivre sa progression de lecture de webtoons. Elle comble le manque d'outils dédiés aux webtoons sur des plateformes comme MyAnimeList ou AniList, en proposant une solution auto-hébergeable, libre et sur-mesure.

> ⚠️ Ce projet est en cours de développement actif (Phase 1 — MVP).

---

## ✨ Fonctionnalités

- 📚 **Catalogue global** — Référencez n'importe quel webtoon, même ceux absents des plateformes officielles
- 📋 **Liste de lecture** — Suivez votre progression chapitre par chapitre
- 🏷️ **Genres & filtres** — Organisez et filtrez votre bibliothèque facilement
- ⭐ **Notes & commentaires** — Gardez vos avis personnels sur chaque titre
- ➕ **Progression rapide** — Bouton `+1 chapitre` en un clic, sans formulaire
- 📊 **Statistiques** — Visualisez vos habitudes de lecture
- 🐳 **Auto-hébergeable** — Lancement complet avec une seule commande Docker

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Frontend | [Nuxt 4](https://nuxt.com) (Vue 3 + TypeScript) |
| Backend | [AdonisJS 7](https://adonisjs.com) (Node.js 24 + TypeScript) |
| ORM | [Lucid](https://lucid.adonisjs.com) (natif AdonisJS) |
| Base de données | [PostgreSQL 16](https://www.postgresql.org) |
| Conteneurisation | [Docker](https://www.docker.com) + Docker Compose |

---

## 🚀 Démarrage rapide

### Prérequis

- [Docker](https://www.docker.com/get-started) et Docker Compose installés
- [Git](https://git-scm.com) installé

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Mvth1s/Le-Fil-des-Chapitres.git
cd Le-Fil-des-Chapitres

# 2. Copier le fichier de configuration
cp .env.example .env
```

Éditez `.env` et remplacez chaque marqueur `<...>` par une valeur générée :

```bash
openssl rand -hex 32   # POSTGRES_PASSWORD, DB_OWNER_PASSWORD, DB_APP_PASSWORD, DB_RO_PASSWORD
openssl rand -hex 16   # APP_KEY
```

Puis lancez l'application :

```bash
docker compose up
```

Les migrations (compte `lfdc_owner`), puis les seeders et le serveur (compte `lfdc_app`), s'exécutent automatiquement. L'application est disponible sur [http://localhost:3000](http://localhost:3000).

> Si vous aviez un volume local créé avant ce changement des comptes PostgreSQL : `docker compose down -v` (base locale uniquement), puis relancez.

### Lancement hors Docker

Copiez `backend/.env.example` en `backend/.env` et adaptez-le, puis lancez le backend (`node ace serve --hmr`) et le frontend (`npm run dev`) depuis leur dossier respectif.

---

## 📁 Structure du projet

```
le-fil-des-chapitres/
├── frontend/               # Application Nuxt 4
│   └── app/
│       ├── components/     # Composants Vue réutilisables
│       ├── pages/          # Pages et routes
│       ├── composables/    # Logique réutilisable (Vue)
│       └── assets/         # Styles, polices, images
│
├── backend/                # API AdonisJS
│   ├── app/
│   │   ├── controllers/    # Contrôleurs des routes API
│   │   ├── models/         # Modèles Lucid (BDD)
│   │   └── validators/     # Validation des données
│   ├── database/
│   │   ├── migrations/     # Migrations SQL
│   │   └── seeders/        # Données initiales (genres)
│   └── start/
│       └── routes.ts       # Déclaration des routes API
│
├── docker-compose.yml      # Orchestration des services
├── .env.example            # Modèle de configuration
└── README.md
```

---

## 📖 Documentation

- [Cahier des charges](CAHIER_DES_CHARGES.md) — Spécifications complètes du projet
- [Déploiement](docs/DEPLOIEMENT.md) *(à venir)*: Hébergement alwaysdata et Vercel
- [Sécurité](docs/SECURITE.md) *(à venir)*: Politique de sécurité
- [API Reference](docs/api.md) *(à venir)* — Documentation des endpoints
- [Guide de contribution](CONTRIBUTING.md) *(à venir)*

---

## 🗺️ Roadmap

### Phase 1 — MVP `v0.1.0` *(en cours)*
- [ ] Mise en place du projet et de l'environnement Docker
- [ ] Schéma de base de données et migrations
- [ ] API REST complète (webtoons, liste de lecture, genres)
- [ ] Interface : catalogue, fiche webtoon, liste de lecture
- [ ] Interface : statistiques basiques
- [ ] Intégration de la charte graphique

### Phase 2 — Améliorations `v0.2.0`
- [ ] Import / Export CSV ou JSON
- [ ] Upload d'image de couverture en local
- [ ] Mode sombre / clair

### Phase 3 — Multi-utilisateurs `v1.0.0`
- [ ] Authentification complète (JWT)
- [ ] Isolation des données par utilisateur
- [ ] Déploiement VPS avec reverse proxy

---

## 🤝 Contribution

Ce projet est personnel et n'accepte pas de contributions externes pour le moment. Les suggestions et retours sont néanmoins les bienvenus via les [Issues](../../issues).

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE) — © 2026 Mvth1s.

