import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Webtoon from '#models/webtoon'
import Genre from '#models/genre'

/**
 * Donnees de demonstration pour voir le catalogue rempli en local, sans
 * avoir a les recreer manuellement a chaque fois. Ne s'execute qu'en
 * developpement (jamais sur Render/Neon en production, voir static
 * environment ci-dessous).
 */
export default class extends BaseSeeder {
  static environment = ['development']

  async run() {
    const webtoons = [
      {
        title: 'Solo Leveling',
        author: 'Chugong',
        description:
          "Dans un monde ou des chasseurs combattent des monstres surgis de portails, Sung Jin-Woo est le plus faible d'entre eux. Jusqu'a ce qu'un mysterieux systeme ne lui permette de devenir plus fort a chaque combat.",
        chaptersTotal: 200,
        genreNames: ['Action', 'Fantasy'],
      },
      {
        title: 'Tower of God',
        author: 'SIU',
        description:
          "Vingt-cinquieme Bam gravit une tour mysterieuse pour retrouver son amie Rachel, chaque etage abritant ses propres epreuves et dangers.",
        chaptersTotal: null,
        genreNames: ['Action', 'Mystère', 'Fantasy'],
      },
      {
        title: 'The Beginning After the End',
        author: 'TurtleMe',
        description:
          "Un roi tout-puissant renait dans un monde de magie avec les souvenirs de sa vie precedente, decide a ne pas repeter les memes erreurs.",
        chaptersTotal: null,
        genreNames: ['Fantasy', 'Action'],
      },
      {
        title: 'Lookism',
        author: 'Park Tae-jun',
        description:
          "Harcele pour son physique, Park Hyung-Suk se reveille un jour avec un second corps, grand et athletique, et decouvre deux vies radicalement differentes.",
        chaptersTotal: null,
        genreNames: ['Drame', 'Tranche de vie'],
      },
      {
        title: 'True Beauty',
        author: 'Yaongyi',
        description:
          "Grace au maquillage, Ju-Kyung cache un complexe qui la ronge depuis toujours. Mais garder ce secret devient de plus en plus difficile.",
        chaptersTotal: 190,
        genreNames: ['Romance', 'Comédie'],
      },
    ]

    for (const { genreNames, ...fields } of webtoons) {
      const webtoon = await Webtoon.updateOrCreate({ title: fields.title }, fields)
      const genres = await Genre.query().whereIn('name', genreNames)
      await webtoon.related('genres').sync(genres.map((genre) => genre.id))
    }
  }
}
