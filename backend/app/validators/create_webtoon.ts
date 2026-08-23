import vine from '@vinejs/vine'

/**
 * Regle metier CAHIER_DES_CHARGES.md US-01 : titre et auteur obligatoires,
 * titre unique dans le catalogue. Le reste est optionnel a la creation.
 * genreIds reference des genres deja existants (pas de creation de genre
 * a la volee ici).
 *
 * Champs en camelCase pour rester coherent avec la serialisation JSON par
 * defaut de Lucid (les proprietes des modeles sont en camelCase, voir
 * app/models/webtoon.ts) : ce que l'API renvoie, elle doit pouvoir le
 * reaccepter tel quel.
 */
export const createWebtoonValidator = vine.compile(
  vine.object({
    title: vine
      .string()
      .trim()
      .minLength(1)
      .unique(async (db, value) => {
        const row = await db.from('webtoons').where('title', value).first()
        return !row
      }),
    author: vine.string().trim().minLength(1),
    description: vine.string().trim().optional(),
    coverUrl: vine.string().trim().url().optional(),
    chaptersTotal: vine.number().positive().optional(),
    link: vine.string().trim().url().optional(),
    genreIds: vine.array(vine.string().uuid()).optional(),
  })
)
