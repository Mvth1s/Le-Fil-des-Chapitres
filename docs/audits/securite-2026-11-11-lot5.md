# Audit securite - lot 5 (tests backend liste de lecture et stats)

- Date : 2026-11-11
- Branche : `test/backend-reading-list-and-stats` (commit `4caaf6f`)
- Perimetre : diff `dev...HEAD`, 2 fichiers ajoutes, 549 lignes
  - `backend/tests/functional/stats.spec.ts`
  - `backend/tests/functional/user_list.spec.ts`

## Secret reel dans l'historique

Aucun.

## Verdict

**Non bloquant.**

## Constats

| # | Constat | Fichier:ligne | Gravite | Correction attendue | Agent |
|---|---|---|---|---|---|
| 1 | gitleaks 8.30.1 en mode `git` (`--log-opts=dev..HEAD`) : 0 commit scanne, car le `.git` du worktree pointe vers un chemin hors du volume monte. Rescan en mode `dir` sur `backend/tests/` : aucune fuite (~22 Ko). | - | info | Aucune | - |
| 2 | Aucun mot de passe, cle, token ni donnee personnelle dans les tests. Donnees fictives uniquement (`author: 'Test'`, titres `Liste ...` / `Stats ...`, UUID nul `00000000-...`). | stats.spec.ts, user_list.spec.ts | ok | Aucune | - |
| 3 | Aucune hypothese de droits DDL du compte `_app` : aucune migration, `db.raw`, `schema`, `CREATE/ALTER/DROP/TRUNCATE` ni `GRANT`. Uniquement du DML (create, attach, delete) via les modeles Lucid, dans `db.beginGlobalTransaction()` annulee par `rollbackGlobalTransaction()` a chaque test. Les genres sont lus (seeder), pas crees. `getCurrentUser()` fait un `User.firstOrFail()` (lecture). | stats.spec.ts:14-19, user_list.spec.ts:16-21 | ok | Aucune | - |
| 4 | Le `setup` de `Stats API` supprime les entrees `user_webtoons` de l'utilisateur courant. Annule par le rollback, mais suppose que la suite tourne sur une base de dev/test et jamais sur la base de production. | stats.spec.ts:17 | mineur | Garder la garde existante (base de test dediee) ; ne jamais pointer `DB_*` de test vers la prod | deploiement |
| 5 | Auteur du commit : pseudo `Mvth1s` conforme, adresse mail `m***@p***` (alias personnel, deja present dans 20 commits anterieurs). Non introduit par ce lot. | commit `4caaf6f` | mineur (hors lot) | Preferer l'adresse noreply GitHub dans `user.email` pour les prochains commits | Mvth1s |
