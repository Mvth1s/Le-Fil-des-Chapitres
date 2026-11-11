# Release 0.1.1 : suivi de mission

Fichier de suivi persistant de la refonte visuelle v0.1.1 (alignement sur le UI kit
Claude Design, sources dans `Maquette/ui-kit/`). Si une session s'interrompt, la suivante
repart d'ici.

## Prérequis

- Tag `v0.1.0` sur `main` (squash de la PR #29) et release GitHub `v0.1.0` : OK.
- `main` réintégrée dans `dev` au lot 1 (le squash avait créé un commit absent de `dev`).
- Fusion de la release vers `main` : `main` impose un historique linéaire. Décision de
  Mvth1s : il retire lui-même cette règle avant le lot 5 pour permettre un merge commit.

## Avancement par lot

- [x] Lot 1 : `chore/ui-kit-sources` (PR #39 ; bundle décompressé, prénom retiré, bundle supprimé)
- [x] Lot 2 : `style/design-tokens-ui-kit` (tokens, V5, couleurs statut/genre, polices auto-hébergées).
  Polices : TTF variables officiels de `google/fonts` (branche `main`, dossiers `ofl/dancingscript`
  et `ofl/playfairdisplay`, 2026-11-11), convertis sans perte avec `woff2_compress`, non découpés.
- [ ] Lot 3 : composants et pages (7 sujets)
- [ ] Lot 4 : `chore/dev-demo-data`
- [ ] Lot 5 : contrôle visuel et release v0.1.1

## Points signalés

- Le prénom réel figurait dans `home.jsx` du bundle ("Bonsoir ..."). Il est retiré des
  sources extraites, mais reste dans l'historique Git du fichier
  `Maquette/Le Fil des Chapitres - UI Kit.html` (ajouté au commit `d7bb545`, PR #2).
  L'historique n'est pas réécrit.
- Les commits créés par GitHub à la fusion d'une PR (merge ou squash) prennent le nom
  affiché et l'adresse du compte GitHub, soit le nom réel (déjà le cas pour #27, #28,
  #29, #30). À régler par Mvth1s dans les paramètres GitHub (nom de profil, adresse
  privée noreply) ; pas de réécriture de `main`. Signalé par l'audit du lot 1.

## Écarts au UI kit

(Rempli au lot 5.)
