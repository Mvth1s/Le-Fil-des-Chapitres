import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import db from '@adonisjs/lucid/services/db'
import Genre from '#models/genre'
import UserWebtoon, { type UserWebtoonStatus } from '#models/user_webtoon'
import Webtoon from '#models/webtoon'
import { getCurrentUser } from '#services/current_user'

/**
 * Les attentes sont des valeurs exactes : chaque test tourne dans une
 * transaction globale (annulee a la fin) et commence par vider la liste de
 * l'utilisateur courant, pour ne dependre d'aucune donnee preexistante.
 */
test.group('Stats API', (group) => {
  // Deux hooks distincts : le rollback est enregistre des l'ouverture de la
  // transaction, meme si la preparation qui suit echoue.
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
  group.each.setup(async () => {
    const user = await getCurrentUser()
    await UserWebtoon.query().where('userId', user.id).delete()
  })

  /** Ajoute a la liste de l'utilisateur courant un webtoon portant les genres donnes. */
  async function addToList(title: string, slugs: string[]) {
    const user = await getCurrentUser()
    const genres = await Genre.query().whereIn('slug', slugs)
    if (genres.length !== slugs.length) throw new Error('genres seedes attendus')
    const webtoon = await Webtoon.create({ title, author: 'Test' })
    await webtoon.related('genres').attach(genres.map((g) => g.id))
    await UserWebtoon.create({ userId: user.id, webtoonId: webtoon.id, status: 'reading' })
  }

  async function distinctGenres(client: ApiClient) {
    const response = await client.get('/api/stats')
    response.assertStatus(200)
    return response.body().distinctGenres
  }

  test('GET /api/stats renvoie des compteurs a zero pour une liste vide', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/api/stats')

    response.assertStatus(200)
    assert.deepEqual(response.body(), {
      totalWebtoons: 0,
      totalChaptersRead: 0,
      byStatus: { reading: 0, completed: 0, on_hold: 0, dropped: 0, plan_to_read: 0 },
      topGenres: [],
      topRated: [],
      distinctGenres: 0,
    })
  })

  test('GET /api/stats calcule les valeurs exactes sur un jeu de donnees connu', async ({
    client,
    assert,
  }) => {
    const user = await getCurrentUser()
    const seededGenres = await Genre.query().whereIn('slug', [
      'action',
      'romance',
      'fantasy',
      'drame',
    ])
    const genres = Object.fromEntries(seededGenres.map((g) => [g.slug, g]))
    assert.lengthOf(Object.keys(genres), 4, 'genres seedes attendus')

    // [titre, genres, statut, chapitres lus, note, chapitres total]
    const dataset: Array<
      [string, string[], UserWebtoonStatus, number, number | null, number | null]
    > = [
      ['Stats A', ['action', 'romance', 'fantasy'], 'reading', 10, 9.5, null],
      ['Stats B', ['action', 'romance', 'fantasy'], 'completed', 50, 8, 50],
      ['Stats C', ['action', 'romance'], 'on_hold', 5, 7, null],
      ['Stats D', ['action', 'drame'], 'dropped', 3, 6.5, null],
      ['Stats E', [], 'plan_to_read', 0, 5, null],
      ['Stats F', [], 'reading', 12, 9, null],
      ['Stats G', [], 'reading', 1, null, null],
    ]
    for (const [title, slugs, status, chaptersRead, rating, chaptersTotal] of dataset) {
      const webtoon = await Webtoon.create({ title, author: 'Test', chaptersTotal })
      await webtoon.related('genres').attach(slugs.map((slug) => genres[slug].id))
      await UserWebtoon.create({
        userId: user.id,
        webtoonId: webtoon.id,
        status,
        chaptersRead,
        rating,
      })
    }
    // Present au catalogue mais hors liste : ne doit compter nulle part.
    const outside = await Webtoon.create({ title: 'Stats hors liste', author: 'Test' })
    await outside.related('genres').attach([genres.drame.id, genres.fantasy.id])

    const response = await client.get('/api/stats')

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.totalWebtoons, 7)
    assert.equal(body.totalChaptersRead, 81)
    assert.deepEqual(body.byStatus, {
      reading: 3,
      completed: 1,
      on_hold: 1,
      dropped: 1,
      plan_to_read: 1,
    })
    assert.deepEqual(body.topGenres, [
      { name: 'Action', slug: 'action', count: 4 },
      { name: 'Romance', slug: 'romance', count: 3 },
      { name: 'Fantasy', slug: 'fantasy', count: 2 },
    ])
    assert.equal(body.distinctGenres, 4)
    assert.deepEqual(
      body.topRated.map((row: { rating: number; webtoon: { title: string } }) => [
        row.webtoon.title,
        row.rating,
      ]),
      [
        ['Stats A', 9.5],
        ['Stats F', 9],
        ['Stats B', 8],
        ['Stats C', 7],
        ['Stats D', 6.5],
      ]
    )
  })

  test('distinctGenres vaut 0 pour un webtoon sans genre', async ({ client, assert }) => {
    await addToList('Distinct sans genre', [])
    assert.strictEqual(await distinctGenres(client), 0)
  })

  test('distinctGenres ignore les webtoons sans genre', async ({ client, assert }) => {
    await addToList('Distinct sans genre', [])
    await addToList('Distinct avec genres', ['action', 'romance'])
    assert.strictEqual(await distinctGenres(client), 2)
  })

  test('distinctGenres ne compte qu une fois un genre partage', async ({ client, assert }) => {
    await addToList('Distinct A', ['action', 'romance'])
    await addToList('Distinct B', ['romance', 'fantasy'])
    assert.strictEqual(await distinctGenres(client), 3)
  })

  test('distinctGenres peut depasser 3 alors que topGenres est limite a 3', async ({
    client,
    assert,
  }) => {
    await addToList('Distinct A', ['action', 'romance'])
    await addToList('Distinct B', ['fantasy', 'drame'])
    const response = await client.get('/api/stats')
    response.assertStatus(200)
    assert.strictEqual(response.body().distinctGenres, 4)
    assert.lengthOf(response.body().topGenres, 3)
  })
})
