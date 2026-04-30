<div align="center">

# 📖 Le Fil des Chapitres

**Suivez, organisez et gérez votre lecture de webtoons.**

[![Version](https://img.shields.io/badge/version-0.1.0--dev-blue?style=flat-square)](https://github.com/ton-username/le-fil-des-chapitres)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-green?style=flat-square)](LICENSE)
[![Nuxt 3](https://img.shields.io/badge/Nuxt-3.x-00DC82?style=flat-square&logo=nuxt.js)](https://nuxt.com)
[![AdonisJS](https://img.shields.io/badge/AdonisJS-6.x-5A45FF?style=flat-square)](https://adonisjs.com)
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
| Frontend | [Nuxt 3](https://nuxt.com) (Vue 3 + TypeScript) |
| Backend | [AdonisJS 6](https://adonisjs.com) (Node.js + TypeScript) |
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
git clone https://github.com/ton-username/le-fil-des-chapitres.git
cd le-fil-des-chapitres

# 2. Copier le fichier de configuration
cp .env.example .env

# 3. Lancer l'application
docker-compose up
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

### Configuration

Éditez le fichier `.env` selon vos besoins :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=lfdc
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=le_fil_des_chapitres

# Application
APP_KEY=votre_clé_secrète
NODE_ENV=development
```

---

## 📁 Structure du projet

```
le-fil-des-chapitres/
├── frontend/               # Application Nuxt 3
│   ├── components/         # Composants Vue réutilisables
│   ├── pages/              # Pages et routes
│   ├── composables/        # Logique réutilisable (Vue)
│   └── assets/             # Styles, polices, images
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

Ce projet est sous licence [MIT](LICENSE) — © 2026 Mathis AGUADO.

