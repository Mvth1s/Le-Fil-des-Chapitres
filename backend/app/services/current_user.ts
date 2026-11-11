import User from '#models/user'

/**
 * Phase 1 : un seul utilisateur en base, aucune authentification (voir
 * CLAUDE.md section 5 et 12). Ce point de resolution unique permet aux
 * controllers de ne jamais dependre directement de la table "users" :
 * remplacer cette fonction par une resolution basee sur la session/JWT
 * suffira a activer le multi-utilisateurs en Phase 3.
 */
export async function getCurrentUser() {
  return User.firstOrFail()
}
