# Audit sécurité - lot 4.1 (AppModal, AppToast, useToast)

- Date : 2026-11-11
- Branche : `feature/ui-modal-and-feedback`
- Périmètre : `git diff dev...HEAD` (commits `5cc9070`, `d13933e`), frontend uniquement
- Mode : lecture seule

**Verdict : non bloquant.** Aucun secret trouvé.

## Points contrôlés

| Point | Statut | Détail |
|---|---|---|
| gitleaks sur `dev..HEAD` | OK | 2 commits scannés, aucune fuite (`--redact`). |
| `v-html`, `innerHTML`, `insertAdjacentHTML`, `eval` dans le code applicatif | OK | Aucun. Les seuls `innerHTML` sont dans `frontend/tests/components/AppModal.spec.ts` (nettoyage `document.body.innerHTML = ''`, sans risque). |
| Messages d'erreur serveur affichés tels quels | OK | `AppToast.vue` affiche `{{ toast.message }}` (interpolation échappée par Vue). Tous les appels `toast.error` / `toast.success` dans `pages/catalogue/[id]/index.vue` et `pages/liste/index.vue` passent des chaînes statiques, aucun contenu de la réponse API. |
| Contenu dynamique dans la modale | OK | `{{ webtoon?.title }}` dans `pages/catalogue/[id]/index.vue` est interpolé, donc échappé. |
| Données personnelles dans le diff | OK | Aucun nom réel, aucune adresse mail, aucune URL nouvelle. |
| Nouvelles dépendances | OK | Aucun changement de `package.json` ni de lockfile. |
| Auteur des commits | Mineur | Nom `Mvth1s` conforme. L'adresse de l'auteur (`m***@p***`, SHA `5cc9070`, `d13933e`) n'est pas une adresse noreply GitHub. Ce problème existait déjà dans l'historique de `dev` et ne vient pas de ce lot. |

## Constats

| Constat | Fichier:ligne | Gravité | Correction attendue | Agent compétent |
|---|---|---|---|---|
| L'adresse de l'auteur des commits n'est pas une adresse noreply | métadonnées git, `5cc9070`, `d13933e` | mineur | Configurer `user.email` sur l'adresse noreply GitHub pour les prochains commits. Ne pas réécrire l'historique sans décision explicite. | Mvth1s (config git locale) |
