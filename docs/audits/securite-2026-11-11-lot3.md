# Audit de sécurité - Lot 3 (documentation et sous-agents)

- Date : 2026-11-11
- Branche : `docs/agents-and-alignment`
- Périmètre : `git diff dev...HEAD` (1 commit, `97d9cc7`, 16 fichiers : 11 agents, `CLAUDE.md`,
  `CAHIER_DES_CHARGES.md`, `README.md`, `roadmap.md`, `docs/release-0.1.0.md`)
- Auditeur : `auditeur-securite` (lecture seule)

## Secrets réels dans l'historique

Aucun.

## Verdict

**Bloquant : non.** Trois points mineurs, aucun important.

## 1. Secrets, noms réels, adresses mail

| Contrôle | Résultat |
|---|---|
| gitleaks `detect --log-opts=dev..HEAD` (Docker) | 1 commit scanné, aucune fuite |
| gitleaks `dir` sur l'arbre courant (Docker) | aucune fuite |
| `grep` d'adresses mail dans les 16 fichiers modifiés | aucune occurrence |
| `grep` mots de passe, clés, chaînes `postgres://`, `export X=` | uniquement des noms de variables et des consignes, aucune valeur |
| Auteur et committer de `97d9cc7` | pseudo `Mvth1s`, adresse alias `m***@p***` (la même que dans les lots précédents, admise) |
| Noms réels | aucun ; seul le pseudo `Mvth1s` apparaît |

Statut : conforme.

## 2. Exactitude des instructions de sécurité de la doc

| Contrôle | Résultat |
|---|---|
| `README.md:73-74` génération par `openssl rand` | conforme : la valeur s'affiche et n'est pas dans la commande, donc rien dans l'historique shell ; elle est collée dans `.env` ignoré (`.gitignore:27`) |
| `README.md` hors Docker : `backend/.env` | ignoré (`backend/.gitignore:7`) |
| `APP_KEY` sur `openssl rand -hex 16` | 32 caractères, au-dessus du minimum de 16 attendu par AdonisJS |
| Comptes `_owner` / `_app` / `_ro` (`CLAUDE.md`, `CAHIER_DES_CHARGES.md`, `roadmap.md`) | cohérents avec le moindre privilège : DDL réservé à `_owner`, backend en `_app` (DML seul), mot de passe `_owner` limité à l'environnement GitHub `production` |
| `npm audit --omit=dev --audit-level=high`, actions épinglées par SHA, `permissions:` minimales | énoncé conforme au socle |
| `X-Api-Key` et Basic Auth présentés comme protection d'instance et pas comme auth utilisateur | cohérent avec la règle 3 de `CLAUDE.md` |
| Avertissement sur la revalidation des droits de `_app` dans alwaysdata | utile, non dangereux |

Statut : conforme. Une remarque mineure (M1), voir le tableau.

## 3. Fichiers d'agents

| Contrôle | Résultat |
|---|---|
| Bloc "Interdits communs" présent dans les 11 agents | oui, empreinte md5 identique pour les 11 |
| Agents d'audit et de relecture sans Write/Edit hors rapport | `code-reviewer`, `auditeur-fonctionnel`, `verificateur-hypotheses` : pas de Write/Edit ; `auditeur-securite` : Write limité à `docs/audits/securite-*.md` |
| Aucun droit Git en écriture | aucun agent n'en reçoit ; `git commit/push/merge`, `gh pr`, `gh release` interdits dans le bloc commun ; les listes Bash ne citent que des commandes de lecture Git |
| `gardien-securite-doc` | Write/Edit limités à `docs/SECURITE.md`, pas de Bash |

Statut : conforme. Deux remarques mineures (M2, M3).

## Constats

| # | Constat | Fichier:ligne | Gravité | Correction attendue | Agent compétent |
|---|---|---|---|---|---|
| M1 | Instruction `docker compose down -v` donnée à l'utilisateur. C'est explicitement limité à la base locale, mais ça efface toutes les données locales sans prévenir | `README.md:85` | mineur | Ajouter "supprime toutes les données locales" (ou proposer de supprimer seulement le volume PostgreSQL) | `docs-keeper` |
| M2 | `gh api` "en lecture" : `gh api` accepte aussi `-X POST/PATCH/DELETE` et `-f`, qui modifient le dépôt (réglages, secrets, branches) | `.claude/agents/deploiement.md:28` | mineur | Préciser "`gh api` en GET uniquement, sans `-X` ni `-f/-F`" | orchestrateur (fichiers d'agents) |
| M3 | Les restrictions Bash ne sont que textuelles : le frontmatter donne Bash complet à 9 agents, sans `.claude/settings.json` de refus. Un agent qui n'applique pas sa consigne peut techniquement lancer `git push`. Par ailleurs, `auditeur-fonctionnel` et `verificateur-hypotheses` ont un périmètre en écriture (`docs/release-0.1.0.md`) mais ni Write ni Edit : soit ils ne peuvent pas écrire, soit ils contourneraient par Bash | `.claude/agents/auditeur-fonctionnel.md:4,15`, `.claude/agents/verificateur-hypotheses.md:4,15` | mineur | Option : `.claude/settings.json` avec `permissions.deny` sur `Bash(git push:*)`, `Bash(git commit:*)`, `Bash(git merge:*)`, `Bash(gh pr:*)`, `Bash(gh release:*)`. Pour les deux agents : ajouter Edit, ou noter que l'orchestrateur reporte leur sortie | orchestrateur (décision Mvth1s) |

## Non vérifié

- `docs/SECURITE.md` et `docs/DEPLOIEMENT.md` sont cités mais n'existent pas encore (README les marque "à venir").
- `npm audit`, CORS, en-têtes et workflows ne font pas partie de ce lot (aucun code modifié) et n'ont pas été contrôlés à nouveau.
