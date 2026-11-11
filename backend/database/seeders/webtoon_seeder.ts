import { DateTime } from 'luxon'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Webtoon from '#models/webtoon'
import Genre from '#models/genre'
import UserWebtoon, { type UserWebtoonStatus } from '#models/user_webtoon'
import { getCurrentUser } from '#services/current_user'

/**
 * Donnees de demonstration pour que l'accueil, la liste et les statistiques
 * soient representatifs en local (tous les statuts, des notes pour le top 5,
 * des genres varies), sans les recreer a la main. Ne s'execute qu'en
 * developpement : jamais en production ni en test (fixtures propres).
 *
 * - Aucune URL d'image (coverUrl null) : pas d'image tierce dans le depot.
 * - Idempotent : updateOrCreate sur "title" (webtoons) et sur
 *   (user_id, webtoon_id) (liste), dates fixes pour ne rien changer au
 *   second passage.
 * - Ordre : Lucid execute les seeders par ordre alphabetique de fichier,
 *   donc genre_seeder puis user_seeder passent avant ce fichier.
 * - Regle metier : chapters_read <= chapters_total, et "completed" quand
 *   chapters_read == chapters_total (le hook beforeSave le garantit aussi).
 */
type Entry = {
  status: UserWebtoonStatus
  chaptersRead: number
  rating?: number
  comment?: string
  startedAt?: string
  finishedAt?: string
}

const WEBTOONS: {
  title: string
  author: string
  description: string
  chaptersTotal: number | null
  genreNames: string[]
  entry?: Entry
}[] = [
  {
    title: 'Solo Leveling',
    author: 'Chugong',
    description:
      "Dans un monde ou des chasseurs combattent des monstres surgis de portails, Sung Jin-Woo est le plus faible d'entre eux. Jusqu'a ce qu'un mysterieux systeme ne lui permette de devenir plus fort a chaque combat.",
    chaptersTotal: 200,
    genreNames: ['Action', 'Fantasy'],
    entry: {
      status: 'completed',
      chaptersRead: 200,
      rating: 9.5,
      comment: 'Rythme parfait, le combat final est memorable.',
      startedAt: '2025-09-02',
      finishedAt: '2025-11-20',
    },
  },
  {
    title: 'Tower of God',
    author: 'SIU',
    description:
      'Vingt-cinquieme Bam gravit une tour mysterieuse pour retrouver son amie Rachel, chaque etage abritant ses propres epreuves et dangers.',
    chaptersTotal: null,
    genreNames: ['Action', 'Mystère', 'Fantasy'],
    entry: { status: 'reading', chaptersRead: 412, rating: 8.5, startedAt: '2025-06-14' },
  },
  {
    title: 'The Beginning After the End',
    author: 'TurtleMe',
    description:
      'Un roi tout-puissant renait dans un monde de magie avec les souvenirs de sa vie precedente, decide a ne pas repeter les memes erreurs.',
    chaptersTotal: 220,
    genreNames: ['Fantasy', 'Action', 'Isekai'],
    entry: { status: 'reading', chaptersRead: 134, startedAt: '2026-03-08' },
  },
  {
    title: 'Lookism',
    author: 'Park Tae-jun',
    description:
      'Harcele pour son physique, Park Hyung-Suk se reveille un jour avec un second corps, grand et athletique, et decouvre deux vies radicalement differentes.',
    chaptersTotal: 520,
    genreNames: ['Drame', 'Tranche de vie'],
    entry: {
      status: 'dropped',
      chaptersRead: 87,
      rating: 6,
      comment: 'Trop de combats de rue a la longue.',
      startedAt: '2025-02-10',
    },
  },
  {
    title: 'True Beauty',
    author: 'Yaongyi',
    description:
      'Grace au maquillage, Ju-Kyung cache un complexe qui la ronge depuis toujours. Mais garder ce secret devient de plus en plus difficile.',
    chaptersTotal: 190,
    genreNames: ['Romance', 'Comédie'],
    entry: { status: 'reading', chaptersRead: 58, startedAt: '2026-08-21' },
  },
  {
    title: 'Sweet Home',
    author: 'Kim Carnby',
    description:
      'Reclus dans son appartement, Cha Hyun-Soo voit les habitants de la ville se transformer en monstres et doit survivre avec ses voisins.',
    chaptersTotal: 141,
    genreNames: ['Horreur', 'Thriller', 'Surnaturel'],
    entry: {
      status: 'completed',
      chaptersRead: 141,
      rating: 9,
      comment: 'Angoissant du debut a la fin.',
      startedAt: '2026-01-05',
      finishedAt: '2026-02-17',
    },
  },
  {
    title: 'Le Cartographe des Lunes',
    author: 'Selenwen',
    description:
      "Une jeune cartographe embarque sur un vaisseau-archive pour dessiner les lunes oubliees d'un empire stellaire en ruine.",
    chaptersTotal: 96,
    genreNames: ['Science-Fiction', 'Mystère'],
    entry: { status: 'on_hold', chaptersRead: 40, rating: 7.5, startedAt: '2025-12-01' },
  },
  {
    title: 'Garbage Time',
    author: '2sung',
    description:
      "L'equipe de basket du lycee Jisang, la plus faible de la ligue, tente de se reconstruire autour d'un nouvel entraineur.",
    chaptersTotal: null,
    genreNames: ['Sports', 'Drame', 'Comédie'],
    entry: { status: 'reading', chaptersRead: 75, rating: 8, startedAt: '2026-05-30' },
  },
  {
    title: 'La Brodeuse du Palais',
    author: 'Fildor',
    description:
      'A la cour de Joseon, une brodeuse decouvre des messages codes caches dans les robes de la reine.',
    chaptersTotal: 120,
    genreNames: ['Historique', 'Romance', 'Mystère'],
    entry: { status: 'plan_to_read', chaptersRead: 0 },
  },
  {
    title: 'Omniscient Reader',
    author: 'singNsong',
    description:
      "Le seul lecteur d'un roman web interminable voit son histoire devenir realite et connait la fin du monde a l'avance.",
    chaptersTotal: 250,
    genreNames: ['Action', 'Fantasy', 'Isekai'],
    entry: { status: 'plan_to_read', chaptersRead: 0 },
  },
  {
    title: 'Les Matins de la Rue Cerise',
    author: 'Cerisaie',
    description:
      'Chaque matin, une boulangerie de quartier voit passer les memes habitues et leurs petites histoires.',
    chaptersTotal: 60,
    genreNames: ['Tranche de vie', 'Comédie'],
  },
]

const date = (iso?: string) => (iso ? DateTime.fromISO(iso) : null)

export default class extends BaseSeeder {
  static environment = ['development']

  async run() {
    const user = await getCurrentUser()

    for (const { genreNames, entry, ...fields } of WEBTOONS) {
      const webtoon = await Webtoon.updateOrCreate({ title: fields.title }, fields)
      const genres = await Genre.query().whereIn('name', genreNames)
      await webtoon.related('genres').sync(genres.map((genre) => genre.id))

      if (!entry) continue
      await UserWebtoon.updateOrCreate(
        { userId: user.id, webtoonId: webtoon.id },
        {
          status: entry.status,
          chaptersRead: entry.chaptersRead,
          rating: entry.rating ?? null,
          comment: entry.comment ?? null,
          startedAt: date(entry.startedAt),
          finishedAt: date(entry.finishedAt),
        }
      )
    }
  }
}
