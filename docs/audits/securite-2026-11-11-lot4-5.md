# Audit de sécurité - lot 4.5 (recherche, filtre par note, tris de la liste)

- Date : 2026-11-11
- Branche : `feature/reading-list-sort-rating`
- Périmètre : diff `origin/dev...HEAD` (commits `3d7d74a`, `514fa68`)
- Fichiers : `frontend/app/pages/liste/index.vue`, `frontend/app/utils/reading-list.ts`,
  `frontend/tests/utils/reading-list.spec.ts`

**Verdict : non bloquant.** Aucun secret réel trouvé.

## Points contrôlés

| Point | Constat | Fichier:ligne | Gravité | Correction attendue | Agent |
|---|---|---|---|---|---|
| Secrets | gitleaks `dir` sur `frontend/app` et `frontend/tests` : aucune fuite | - | OK | - | - |
| Données personnelles | Commits signés `Mvth1s` (adresse masquée : `m***@p***`). Aucune adresse mail dans les fichiers. Les auteurs des fixtures de test (`Paul`, `Jean`, nom complet générique l. 60) sont fictifs | `reading-list.spec.ts:59-61` | OK | - | - |
| Injection HTML | Aucun `v-html` ni `innerHTML` (ni dans le diff, ni dans `frontend/app`). Le compteur et les libellés passent par l'interpolation Vue, qui échappe le contenu | `index.vue:278-285` | OK | - | - |
| Regex construite depuis la saisie | Aucune `RegExp` dynamique : la recherche utilise `normalizeSearch` (regex littérale fixe) puis `String.includes`. Pas de risque de ReDoS ni d'injection de motif | `reading-list.ts:41-48`, `utils/search.ts` | OK | - | - |
| Valeur de filtre | `minRating` vient d'un select à valeurs fixes, converti par `Number` ; filtre et tri restent côté client, aucune requête construite depuis la saisie | `index.vue:73` | OK | - | - |
| Dépendances | Aucun `package.json` ni lockfile modifié ; `useDebouncedRef` est un composable existant | - | OK | - | - |
| Caractères invisibles | Aucun espace insécable, caractère de largeur nulle, BOM, contrôle bidi, tiret cadratin ou demi-cadratin dans les trois fichiers | - | OK | - | - |

## Hors périmètre

Pas de `npm audit` ni de gitleaks sur l'historique : pas de nouvelle dépendance, et
l'historique a été couvert par les audits précédents.
