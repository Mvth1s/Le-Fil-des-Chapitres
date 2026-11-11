# Audit sécurité - lot 4.4 (recherche, filtres, tris, vue grille/liste)

Date : 2026-11-11. Branche `feature/catalogue-search-filters`, diff `dev...HEAD` (commit b32a59f).
Lecture seule.

**Verdict : non bloquant.** Aucun secret, aucune donnée personnelle versionnée, aucune injection.

## Points contrôlés

| Point | Statut | Détail |
|---|---|---|
| Secrets (gitleaks `dir` sur `frontend/app`, `frontend/tests`) | OK | "no leaks found" sur les deux. Grep mot de passe / token / clé / adresse mail sur le diff : rien. |
| Données personnelles | OK | Aucune dans les fichiers. Auteur du commit : pseudo `Mvth1s`, adresse `m***@p***` (métadonnée git, identique aux lots précédents, pas dans un fichier). |
| `v-html` / `innerHTML` / `eval` | OK | Aucune occurrence dans `app/pages/catalogue/index.vue` ni les nouveaux utilitaires. |
| Paramètre d'URL `vue` | OK | `index.vue:106` : réduit à `'list'` ou `'grid'` par comparaison stricte avec `'liste'` ; la valeur brute n'est jamais réinjectée dans le DOM. `index.vue:108` : seules les constantes `'liste'` / `undefined` sont écrites. |
| Recherche réinjectée / ReDoS | OK | Saisie liée par `v-model` (`index.vue:135`), comparée via `String.includes` (`utils/catalogue.ts`). Aucune regex construite depuis la saisie ; la seule regex (`utils/search.ts:7`, classe fixe `[̀-ͯ]`) est linéaire. Recherche non persistée dans l'URL. |
| Liens | OK | `:to` construits depuis `webtoon.id` (UUID API), pas depuis l'URL ou la saisie. |
| Nouvelles dépendances | OK | Aucun `package.json` / `package-lock.json` modifié. |
| Config TS / ESLint | OK | `nuxt.config.ts` : `typescript.appTsConfig` / `nodeTsConfig` élargissent seulement l'inclusion des tests ; `runtimeConfig` inchangé. `eslint.config.mjs` simplifié, aucune règle désactivée. |
| Caractères invisibles / tirets cadratins | OK | Grep U+200B-200F, U+2028-202E, U+2060-2064, U+FEFF, U+00AD, U+2014 sur le diff : rien. |

## Constats

Aucun constat bloquant, important ou mineur.

Non vérifié : historique git complet (gitleaks en mode git indisponible dans un worktree, couvert par les audits précédents) ; `npm audit` non relancé (aucune dépendance modifiée).
