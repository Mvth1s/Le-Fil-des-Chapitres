# Audit sécurité - lot 4.2 (ajout à la liste depuis la fiche webtoon)

Date : 2026-11-11
Branche : `feature/add-to-reading-list`, diff `dev...HEAD` (4 commits)
Fichiers : `frontend/app/pages/catalogue/[id]/index.vue`, `frontend/app/utils/validation.ts`,
`frontend/tests/components/validation.spec.ts`

**Verdict : non bloquant.** Aucun secret réel détecté.

## Points contrôlés

| Point | Statut | Détail |
|---|---|---|
| Secrets (gitleaks `dir`) | OK | `frontend/app` et `frontend/tests` : no leaks found. Mode git non utilisé (worktree). |
| Données personnelles dans le diff | OK | Aucune adresse mail, aucun nom réel ajouté. |
| Auteurs des commits du lot | OK | Pseudo `Mvth1s` sur les 4 commits ; adresse masquée `m***@p***` (déjà connue des audits précédents, non introduite par ce lot). |
| Injection HTML | OK | Aucun `v-html` ni `innerHTML` dans `frontend/app`. Les messages serveur (`extractValidationErrors`) passent par `toast.error`, rendus par interpolation `{{ toast.message }}` dans `AppToast.vue:33,52` (échappement Vue). |
| Entrée utilisateur envoyée | OK | `webtoonId` vient de la route, `status` d'un select borné par `USER_WEBTOON_STATUSES` ; validation serveur existante (VineJS) reste la barrière. |
| Lien externe | Hors diff | `rel="noopener"` déjà présent sur le lien `webtoon.link`. |
| Nouvelles dépendances | OK | Aucun `package.json` ni lockfile modifié. |

## Constats

| Constat | Fichier:ligne | Gravité | Correction attendue | Agent |
|---|---|---|---|---|
| Détection du doublon par la forme de la 422 (sans champ `field`), pas par un code d'erreur ; confusion possible avec `E_CHAPTERS_EXCEED_TOTAL`. Impact fonctionnel, pas sécurité ; raccourci documenté dans le code. | `frontend/app/utils/validation.ts:26-39` | mineur | Exposer un code d'erreur côté backend si un autre formulaire réutilise la fonction. | `backend-adonisjs` |
