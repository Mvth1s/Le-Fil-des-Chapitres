import vine from '@vinejs/vine'

/**
 * CAHIER_DES_CHARGES.md US-06 : mise a jour rapide de la progression.
 * Le client envoie la nouvelle valeur absolue de chapitres lus (le bouton
 * "+1 chapitre" calcule cette valeur cote frontend), pas un increment.
 */
export const updateProgressValidator = vine.compile(
  vine.object({
    chaptersRead: vine.number().min(0),
  })
)
