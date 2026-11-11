# Changelog

Toutes les modifications notables de ce projet sont consignées ici.
Format : [Keep a Changelog 1.1.0](https://keepachangelog.com/fr/1.1.0/).
Versionnage : [SemVer](https://semver.org/lang/fr/).

## [Unreleased]

## [0.1.0] - 2026-11-11

Première version (Phase 1, MVP). Les PR #1 et #2 portent les ressources du projet.

### Ajouté

- Projet full-stack Nuxt 4, AdonisJS et PostgreSQL, lancé par Docker Compose (#3).
- Schéma de base de données et migrations : utilisateurs, webtoons, genres, jonctions (#4).
- API CRUD des webtoons et endpoint des genres (#5).
- API de la liste de lecture (ajout, édition, progression, retrait) et des statistiques (#6).
- Design system et charte graphique (#7), logos et favicons (#13).
- Pages du catalogue, seeder de démonstration et Adminer (#8).
- Formulaires de création et de modification des webtoons (#9).
- Page de liste de lecture avec filtres et changement de statut (#10).
- Bouton +1 chapitre pour la progression rapide (#11).
- Page statistiques (#12) et page d'accueil en mini tableau de bord (#14).
- Intégration continue GitHub Actions (#15).
- Composant `AppModal` accessible et messages toast (#20).
- Ajout d'un webtoon à sa liste depuis la fiche (#22).
- Catalogue : recherche, filtres, tris et bascule grille / liste (#23).
- Liste : édition d'une entrée, saisie directe du chapitre et retrait (#24).
- Liste : recherche, filtre par note minimale et tris (#26).
- Déploiement : protection de l'instance, workflow alwaysdata, Vercel et guides (#25).
- Tests backend de la liste de lecture et des statistiques (#21).

### Modifié

- Identité de l'éditeur remplacée par le pseudo Mvth1s (#16).
- Migration vers AdonisJS 7 (#18).
- Agents au contrat et documentation alignée sur alwaysdata, Vercel et la sécurité (#19).
- `AppModal` et toasts remplacent `confirm` et `alert` (#20).

### Corrigé

- Réponse 404 au lieu de 500 pour un identifiant non UUID (#21).
- Couvertures, contrastes AA et vérification responsive (#27).

### Sécurité

- `link` et `coverUrl` limités aux protocoles http et https (#17).
- Socle de sécurité : secrets hors dépôt, trois rôles PostgreSQL (`_owner`, `_app`, `_ro`) (#18).
- Proxy Nitro avec `X-Api-Key`, HTTP Basic Auth sur le frontend, `GET /health` public (#25).

[Unreleased]: https://github.com/Mvth1s/Le-Fil-des-Chapitres/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Mvth1s/Le-Fil-des-Chapitres/releases/tag/v0.1.0
