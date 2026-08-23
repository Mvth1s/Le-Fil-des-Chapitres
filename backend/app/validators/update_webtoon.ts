import vine from '@vinejs/vine'

/**
 * Meme regles que la creation, mais l'unicite du titre ignore la ligne en
 * cours de modification (sinon un webtoon ne pourrait jamais etre modifie
 * sans changer son titre). L'id courant est passe via le "meta" du
 * validateur, voir webtoons_controller.ts#update.
 */
export const updateWebtoonValidator = vine.compile(
  vine.object({
    title: vine
      .string()
      .trim()
      .minLength(1)
      .unique(async (db, value, field) => {
        const row = await db
          .from('webtoons')
          .where('title', value)
          .whereNot('id', field.meta.webtoonId)
          .first()
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
