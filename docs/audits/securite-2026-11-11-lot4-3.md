# Audit de sécurité - lot 4.3 (édition d'une entrée de liste)

Date : 2026-11-11. Branche `feature/reading-entry-edit`, diff `origin/dev...HEAD`
(6 commits, b85d329 à 15c7aad, 15 fichiers).

**Secret réel dans le périmètre : aucun.**

**Verdict bloquant : non.**

## Points contrôlés

| Point | Statut | Preuve |
|---|---|---|
| Secrets (gitleaks `dir` sur le worktree) | Conforme | `no leaks found`, ~4 Mo analysés |
| Données personnelles | Conforme | Auteur des 6 commits : `Mvth1s <m***@p***>` (adresse noreply GitHub, déjà en place sur dev). Aucune adresse mail ni nom réel dans les fichiers modifiés |
| Validation serveur avant la base | Conforme | `update` : `findOwnEntryOrFail` puis `validateUsing(updateUserWebtoonValidator)` avant tout `merge`. Le `merge` est construit champ par champ depuis `payload` (6 champs, tous déclarés dans le validator), pas de `request.all()` ni de spread du corps : pas de mass assignment. `webtoonId`/`userId` non modifiables |
| Nouveaux types acceptés | Conforme | `null` admis seulement sur `rating`, `comment`, `startedAt`, `finishedAt` (colonnes nullables). `rating` : 0 à 10, pas de 0,5 (`rating_rule.ts`). `chaptersRead` : `withoutDecimals().min(0)` sur POST, PUT et PATCH, plafond `chapters_total` toujours contrôlé dans le controller |
| Hook du modèle | Conforme | `finishedAt` auto conditionné à `$dirty.status === 'completed'` : aucun effet sécurité |
| Injection HTML | Conforme | Aucun `v-html`, `innerHTML` ni `eval` ajouté. Commentaire affiché par interpolation `{{ entry.comment }}` (`frontend/app/pages/liste/index.vue:292`), donc échappé |
| Nouvelles dépendances | Conforme | Aucun `package.json` ni lockfile modifié |
| Caractères invisibles / tirets cadratins | Conforme | Aucun dans les lignes ajoutées (U+200B-200F, U+2028-202F, U+2060-2064, U+FEFF, U+00A0, U+2013, U+2014) |

## Constats

| Constat | Fichier:ligne | Gravité | Correction attendue | Agent |
|---|---|---|---|---|
| `comment` sans longueur maximale (colonne `text`) : un corps volumineux est accepté jusqu'à la limite du bodyparser. Préexistant, non introduit par ce lot | `backend/app/validators/update_user_webtoon.ts:18`, `create_user_webtoon.ts:16` | Mineur | Ajouter `.maxLength(n)` au commentaire (à arbitrer avec le cahier) | `backend-adonisjs` |

## Non vérifié

Pas d'exécution des tests ni de `npm audit` (aucune dépendance modifiée). Historique Git
complet non rescanné (mode `dir` demandé).
