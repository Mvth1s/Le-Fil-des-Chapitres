# Audit de securite - lot 4.6 (couvertures, contrastes, responsive)

- Date : 2026-11-11
- Branche : `fix/cover-and-responsive`, diff `origin/dev...HEAD` (commit `b3c38f5`, 11 fichiers frontend)
- Verdict : **non bloquant**

Aucun secret trouve.

## Points controles

| Point | Statut | Preuve |
|---|---|---|
| Validation serveur de `coverUrl` | OK | `backend/app/validators/url_options.ts:6-9` (`protocols: ['http','https']`, `require_protocol: true`), utilise par `create_webtoon.ts:27` et `update_webtoon.ts:26` |
| XSS via `coverUrl` | OK | binding `:src` uniquement (`frontend/app/components/AppCover.vue:46`), pas de `v-html`, `innerHTML` ni `style`/`url()` avec donnee utilisateur dans le diff. `javascript:` refuse par le serveur et inoperant dans `img src` |
| Fuite de referent | OK | `referrerpolicy="no-referrer"` (`AppCover.vue:52`), en plus de l'en-tete global `Referrer-Policy: same-origin` (`frontend/nuxt.config.ts:43`) |
| CSP `img-src 'self' https: data:` et URL `http://` | OK | une image bloquee (CSP ou contenu mixte) declenche `error` : repli via `@error` (`AppCover.vue:54`) et, si l'echec precede l'hydratation, via le controle `complete && naturalWidth === 0` au montage (`AppCover.vue:26-28`). Le repli n'emet aucune requete externe |
| Secrets (gitleaks `dir frontend/app`) | OK | `no leaks found` (image docker `zricethezav/gitleaks:latest`) |
| Donnees personnelles dans le diff | OK | aucune adresse ni nom reel dans le contenu ; auteur du commit : pseudo `Mvth1s` |
| Dependances | OK | aucun `package.json` ni lockfile modifie |
| Caracteres invisibles, tirets cadratins | OK | aucun (U+200B-U+200F, U+2028-U+202F, U+2060-U+206F, U+FEFF, U+00A0, U+2013, U+2014) dans le diff |

## Constats

| Constat | Fichier:ligne | Gravite | Correction attendue | Agent |
|---|---|---|---|---|
| Lien externe `target="_blank" rel="noopener"` sans `noreferrer` ; sans effet reel grace a `Referrer-Policy: same-origin` | `frontend/app/pages/catalogue/[id]/index.vue` (lien `webtoon.link`) | mineur | ajouter `noreferrer` par coherence avec `AppCover` (facultatif) | `frontend-nuxt` |
| Adresse mail de l'auteur des commits (`m***@p***`) dans les metadonnees, preexistant (64 commits sur `dev`) ; 28 commits de fusion GitHub portent un nom reel (preexistant, hors lot) | historique Git, ex. `b3c38f5` | mineur (hors lot) | deja connu, a traiter hors de ce lot si souhaite (noreply GitHub) | humain (config Git) |
| Page `design-system` : `src` `data:` invalide de demonstration | `frontend/app/pages/design-system.vue` | aucun | autorise par la CSP (`data:`), sert a montrer le repli | - |

Non verifie : comportement reel dans un navigateur (pas de test d'execution) ; `npm audit` non relance (aucune dependance modifiee).
