# UI kit Claude Design (référence visuelle v0.1.1)

Sources lisibles du UI kit exporté de Claude Design. Le bundle d'origine
(`Le Fil des Chapitres - UI Kit.html`, sources gzip en base64) a été décompressé puis
supprimé du dépôt ; il reste consultable dans l'historique Git.

## Contenu

| Fichier | Rôle |
|---|---|
| `tokens-and-styles.css` | Tokens (couleurs, ombres, rayons, espacements, typographie) et styles de tous les composants |
| `data.jsx` | Données d'exemple, libellés de statut, 9 dégradés de couverture, couleurs de genre |
| `atoms.jsx` | `Button`, `Tag`, `StatusChip`, `EmptyState`, `Cover` (dégradé + pile de livres) |
| `webtoon-card.jsx` | Carte webtoon : couverture, chip de statut, barre dorée, "+1 chapitre" |
| `nav.jsx` | Header : logo, liens avec soulignement doré, recherche globale |
| `home.jsx`, `catalogue.jsx`, `my-list.jsx`, `stats.jsx` | Les quatre pages |
| `app.jsx` | Routage et état de démonstration |
| `template.html` | Page hôte d'origine (React et Babel retirés : référence en lecture ; pour l'ouvrir, il faut fournir React 18 et Babel standalone) |
| `assets/` | Logo carré et favicon du bundle |
| `captures/` | Captures de la maquette validée (accueil, catalogue, liste, stats) |

Les polices TTF du bundle n'ont pas été conservées : l'application auto-héberge les woff2
(décision V6), et `tokens-and-styles.css` pointe vers ces fichiers, ajoutés dans
`frontend/public/fonts/` au lot 2.

## Ce qui prime sur le UI kit

Le UI kit fait foi pour la mise en page, les composants et les tokens, mais les décisions
V1 à V8 du prompt de refonte v0.1.1 l'emportent, notamment :

- le cahier des charges reste la référence fonctionnelle (V1) ;
- tutoiement, aucun prénom, aucun avatar (V2, V3) ;
- couverture générée déterministe, plus d'initiales (V4) ;
- corrections d'accessibilité : texte des boutons dorés en encre, focus `#8C6E35`,
  bordure des champs `#8B8B7A`, tags et badges en 14 px minimum, contrastes AA (V5) ;
- polices auto-hébergées (V6), carte de liste allégée et onglets de statut (V7),
  recherche globale vers `/catalogue?q=...` et menu mobile (V8).

Les clés de statut du UI kit (`paused`, `plan`) correspondent à `on_hold` et
`plan_to_read` dans l'API.
