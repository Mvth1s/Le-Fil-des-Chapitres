# Audit de sécurité - branche `chore/dependabot-config` (2026-11-11)

Périmètre : `git diff dev...HEAD` (2 commits : `bf1a1bb`, `86e15e0`), fichiers
`.github/dependabot.yml`, `CLAUDE.md`, `README.md`. Référence : `docs/SECURITE.md`.

## Secrets réels dans l'historique

Aucun. gitleaks (image officielle) : `dev..HEAD` 2 commits, aucune fuite ; historique
complet `--all` 128 commits, aucune fuite. Le scan de l'arbre de travail signale 6
occurrences, toutes dans des fichiers ignorés et non versionnés (`.env` local,
`frontend/.nuxt/dev/index.mjs` généré) : attendu, hors dépôt.

## Verdict

**Conforme, fusion possible.** Aucun bloquant. Un point important de documentation
(SECURITE.md périmé sur Dependabot) et deux mineurs.

## Constats

| # | Constat | Fichier:ligne | Gravité | Correction attendue | Agent compétent |
|---|---|---|---|---|---|
| I1 | `docs/SECURITE.md` décrit l'ancienne politique (hebdomadaire, 5 PR) et compte sur "les montées de version majeure proposées par Dependabot" pour résorber `deepmerge`, `minimatch`, `glob`. Les majeures npm sont désormais ignorées en mises à jour de version : ces failles modérées ne viendront plus que par les mises à jour de sécurité (vers `main`, si activées dans les réglages GitHub) ou à la main | `docs/SECURITE.md:120`, `:143`, `:189` | important | Décrire la nouvelle politique (mensuelle, cible `dev`, groupes, majeures npm ignorées, cooldown 14 j, 2 PR) ; préciser que les security updates ne suivent pas ces règles et ciblent `main` ; requalifier le suivi des modérées (security updates ou montée manuelle) | `gardien-securite-doc` |
| M1 | Contradiction interne : la section 9 décrit la politique mensuelle, la section 12 bis dit encore "Dependabot hebdomadaire" | `CLAUDE.md:268` | mineur | Remplacer par "Dependabot mensuel vers `dev` (sécurité vers `main`)" | Mvth1s (aucun agent ne modifie `CLAUDE.md`) |
| M2 | Une PR de sécurité Dependabot fusionnée sur `main` déclenche la production sans passer par `dev` : `deploy-backend.yml` sur push `main` (chemins `backend/**`) et Vercel sur `main`. Elle reste gardée par la CI (`ci.yml` sur PR vers `main`) | `.github/workflows/deploy-backend.yml:54-56` | mineur (accepté) | Rien à corriger ; relire ces PR comme une release (résynchronisation `main` -> `dev` déjà documentée dans `CLAUDE.md` section 9) | Mvth1s |
| M3 | Auteur des 2 commits : pseudo `Mvth1s` conforme, adresse `m***@p***` (alias personnel, déjà présent dans l'historique, accepté). Rien de nouveau dans les fichiers | commits `bf1a1bb`, `86e15e0` | mineur (connu) | Adresse noreply GitHub dans `user.email` pour la suite | Mvth1s |

## Points contrôlés

| Point | Statut | Détail |
|---|---|---|
| Mises à jour de sécurité non désactivées | OK | Les deux `ignore` (`dependency-name: "*"`) portent `update-types: version-update:semver-major` ; aucun `ignore` nu. Avec `target-branch`, la configuration de l'écosystème ne s'applique plus aux security updates (comportement documenté par GitHub), qui ciblent la branche par défaut. Commentaire en tête de `.github/dependabot.yml` exact |
| Activation des security updates | non vérifiable | Réglage du dépôt GitHub (Settings > Code security), absent du dépôt. À confirmer par Mvth1s |
| Cooldown 14 jours | OK | Cohérent avec le risque supply chain (paquets compromis généralement retirés en quelques jours) ; le cooldown ne s'applique pas aux security updates, donc pas de retard sur un correctif. `default-days` seul pour `github-actions`, conforme |
| Groupes et limite | OK | npm : groupe mineures + correctifs, majeures ignorées, donc rien hors groupe. Actions : majeures regroupées ; les actions restent épinglées par SHA, revue via la PR et la CI. Limite 2 PR : ne concerne que les mises à jour de version |
| Secrets en dur | OK | Aucun dans le diff ; gitleaks propre |
| Données personnelles | OK | `git grep` sans nom réel ni adresse dans l'arbre (hors audits masqués) ; seul `Mvth1s` dans le diff |
| `npm audit --omit=dev --audit-level=high` | OK | Backend et frontend exit 0 ; aucun lockfile modifié par la branche |
| Caractères interdits | OK | Aucun tiret cadratin ni caractère invisible ajouté (le cadratin de `README.md` "Phase 2" est une ligne de contexte antérieure) |
| README | OK | Mention "`cover_url` accepte `http`, la CSP le bloque" : point fonctionnel connu, sans impact de sécurité (la CSP fait son rôle) |

## Méthode

gitleaks `git` (`dev..HEAD`, `--all`) et `dir` via l'image Docker officielle ;
`git log`, `git diff dev...HEAD`, `git grep` ; `npm audit` dans `backend/` et `frontend/`.
Aucune opération Git en écriture.
