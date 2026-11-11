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

- `cover_url` en `http://` est accepté par le backend mais bloqué par la CSP (`img-src https:`) :
  la couverture générée s'affiche. Le formulaire indiquera "URL https" (sujet 3.7) ; restreindre le
  validateur backend changerait le contrat de l'API, décision laissée à Mvth1s.

## Écarts au UI kit

- Conteneur : 1200 px max avec marges de 28 px (1144 px utiles), comme la capture du UI kit,
  au lieu des "environ 1000 px" du prompt (V1 : le UI kit fait foi pour la mise en page).
- Lien actif du header : texte en encre (le doré du UI kit n'atteint pas AA sur le crème), V5.
- Logo du header : pile de livres seule (`logo-icon.png`), le logo carré du UI kit contient un
  texte illisible à 38 px.

(Complété au lot 5.)

## Suggestions de relecture non traitées

- Catalogue : course de quelques ms entre `router.replace` et le watch de `route.query.q`
  pouvant perdre une frappe (lot 3.2).
