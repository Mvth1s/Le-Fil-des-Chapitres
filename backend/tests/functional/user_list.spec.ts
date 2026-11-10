import { test } from '@japa/runner'
import type { Group } from '@japa/runner/core'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import UserWebtoon, { type UserWebtoonStatus } from '#models/user_webtoon'
import Webtoon from '#models/webtoon'
import { getCurrentUser } from '#services/current_user'

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Chaque test tourne dans une transaction globale annulee a la fin : les
 * requetes HTTP du serveur de test partagent la meme connexion, donc rien
 * de ce qui est cree ici ne survit au test.
 */
function isolateEachTest(group: Group) {
  group.each.setup(async () => {
    await db.beginGlobalTransaction()
    return () => db.rollbackGlobalTransaction()
  })
}

async function createEntry(
  webtoon: Webtoon,
  status: UserWebtoonStatus = 'plan_to_read',
  chaptersRead = 0
) {
  const user = await getCurrentUser()
  return UserWebtoon.create({ userId: user.id, webtoonId: webtoon.id, status, chaptersRead })
}

const today = () => DateTime.now().toISODate()

test.group('User list API - lecture et creation', (group) => {
  isolateEachTest(group)

  test('GET /api/user/list renvoie les entrees avec le webtoon et ses genres', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({ title: 'Liste GET', author: 'Test' })
    const entry = await createEntry(webtoon)

    const response = await client.get('/api/user/list')

    response.assertStatus(200)
    const found = response.body().find((row: { id: string }) => row.id === entry.id)
    assert.exists(found)
    assert.equal(found.webtoon.title, 'Liste GET')
    assert.isArray(found.webtoon.genres)
  })

  test('POST /api/user/list cree une entree (201) avec chaptersRead a 0 par defaut', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({ title: 'Liste POST', author: 'Test' })

    const response = await client
      .post('/api/user/list')
      .json({ webtoonId: webtoon.id, status: 'plan_to_read', rating: 7.5, comment: 'A lire' })

    response.assertStatus(201)
    assert.equal(response.body().webtoonId, webtoon.id)
    assert.equal(response.body().status, 'plan_to_read')
    assert.equal(response.body().chaptersRead, 0)
    assert.strictEqual(response.body().rating, 7.5)
    assert.equal(response.body().comment, 'A lire')
    assert.equal(response.body().webtoon.title, 'Liste POST')
    assert.exists(await UserWebtoon.find(response.body().id))
  })

  test('POST /api/user/list renseigne startedAt au statut reading', async ({ client, assert }) => {
    const webtoon = await Webtoon.create({ title: 'Liste POST reading', author: 'Test' })

    const response = await client
      .post('/api/user/list')
      .json({ webtoonId: webtoon.id, status: 'reading' })

    response.assertStatus(201)
    assert.equal(response.body().startedAt, today())
    assert.isNull(response.body().finishedAt)
  })

  test('POST /api/user/list passe en completed quand chaptersRead atteint chaptersTotal', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({
      title: 'Liste POST total',
      author: 'Test',
      chaptersTotal: 20,
    })

    const response = await client
      .post('/api/user/list')
      .json({ webtoonId: webtoon.id, status: 'reading', chaptersRead: 20 })

    response.assertStatus(201)
    assert.equal(response.body().status, 'completed')
    assert.equal(response.body().finishedAt, today())
  })

  test('POST /api/user/list refuse un doublon (422)', async ({ client, assert }) => {
    const webtoon = await Webtoon.create({ title: 'Liste doublon', author: 'Test' })
    await createEntry(webtoon)

    const response = await client
      .post('/api/user/list')
      .json({ webtoonId: webtoon.id, status: 'reading' })

    response.assertStatus(422)
    assert.lengthOf(
      await UserWebtoon.query().where('webtoonId', webtoon.id),
      1,
      'aucune seconde entree ne doit etre creee'
    )
  })

  test('POST /api/user/list renvoie 404 pour un webtoon inexistant', async ({ client }) => {
    const response = await client
      .post('/api/user/list')
      .json({ webtoonId: UNKNOWN_ID, status: 'reading' })

    response.assertStatus(404)
  })

  test('POST /api/user/list refuse chaptersRead au-dela de chaptersTotal (422)', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({
      title: 'Liste POST depassement',
      author: 'Test',
      chaptersTotal: 10,
    })

    const response = await client
      .post('/api/user/list')
      .json({ webtoonId: webtoon.id, status: 'reading', chaptersRead: 11 })

    response.assertStatus(422)
    assert.isNull(await UserWebtoon.findBy('webtoonId', webtoon.id))
  })

  const invalidPayloads: Array<[string, Record<string, unknown>]> = [
    ['statut invalide', { status: 'finished' }],
    ['statut absent', { status: undefined }],
    ['note superieure a 10', { status: 'reading', rating: 10.5 }],
    ['note negative', { status: 'reading', rating: -1 }],
    ['chaptersRead negatif', { status: 'reading', chaptersRead: -1 }],
  ]
  for (const [label, payload] of invalidPayloads) {
    test(`POST /api/user/list renvoie 422 : ${label}`, async ({ client, assert }) => {
      const webtoon = await Webtoon.create({ title: `Liste POST 422 ${label}`, author: 'Test' })

      const response = await client
        .post('/api/user/list')
        .json({ webtoonId: webtoon.id, ...payload })

      response.assertStatus(422)
      assert.isNull(await UserWebtoon.findBy('webtoonId', webtoon.id))
    })
  }

  test('POST /api/user/list renvoie 422 pour un webtoonId qui n est pas un UUID', async ({
    client,
  }) => {
    const response = await client
      .post('/api/user/list')
      .json({ webtoonId: 'not-a-uuid', status: 'reading' })

    response.assertStatus(422)
  })
})

test.group('User list API - mise a jour (PUT)', (group) => {
  isolateEachTest(group)

  test('PUT /api/user/list/:id met a jour statut, note, commentaire et dates', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({ title: 'Liste PUT', author: 'Test' })
    const entry = await createEntry(webtoon)

    const response = await client.put(`/api/user/list/${entry.id}`).json({
      status: 'on_hold',
      rating: 8.5,
      comment: 'En pause',
      startedAt: '2026-01-15',
      finishedAt: '2026-02-20',
    })

    response.assertStatus(200)
    assert.equal(response.body().status, 'on_hold')
    assert.strictEqual(response.body().rating, 8.5)
    assert.equal(response.body().comment, 'En pause')
    assert.equal(response.body().startedAt, '2026-01-15')
    assert.equal(response.body().finishedAt, '2026-02-20')

    await entry.refresh()
    assert.equal(entry.status, 'on_hold')
    assert.equal(entry.rating, 8.5)
    assert.equal(entry.startedAt?.toISODate(), '2026-01-15')
    assert.equal(entry.finishedAt?.toISODate(), '2026-02-20')
  })

  test('PUT /api/user/list/:id ne modifie que les champs envoyes', async ({ client, assert }) => {
    const webtoon = await Webtoon.create({ title: 'Liste PUT partiel', author: 'Test' })
    const entry = await createEntry(webtoon, 'on_hold', 4)

    const response = await client.put(`/api/user/list/${entry.id}`).json({ comment: 'Note seule' })

    response.assertStatus(200)
    assert.equal(response.body().status, 'on_hold')
    assert.equal(response.body().chaptersRead, 4)
    assert.equal(response.body().comment, 'Note seule')
  })

  test('PUT /api/user/list/:id renseigne startedAt au passage en reading', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({ title: 'Liste PUT reading', author: 'Test' })
    const entry = await createEntry(webtoon, 'plan_to_read')

    const response = await client.put(`/api/user/list/${entry.id}`).json({ status: 'reading' })

    response.assertStatus(200)
    assert.equal(response.body().startedAt, today())
  })

  test('PUT /api/user/list/:id renseigne finishedAt au passage en completed', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({ title: 'Liste PUT completed', author: 'Test' })
    const entry = await createEntry(webtoon, 'reading', 3)

    const response = await client.put(`/api/user/list/${entry.id}`).json({ status: 'completed' })

    response.assertStatus(200)
    assert.equal(response.body().finishedAt, today())
  })

  test('PUT /api/user/list/:id passe en completed quand chaptersRead atteint chaptersTotal', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({
      title: 'Liste PUT total',
      author: 'Test',
      chaptersTotal: 30,
    })
    const entry = await createEntry(webtoon, 'reading', 10)

    const response = await client.put(`/api/user/list/${entry.id}`).json({ chaptersRead: 30 })

    response.assertStatus(200)
    assert.equal(response.body().status, 'completed')
    assert.equal(response.body().finishedAt, today())
  })

  test('PUT /api/user/list/:id refuse chaptersRead au-dela de chaptersTotal (422)', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({
      title: 'Liste PUT depassement',
      author: 'Test',
      chaptersTotal: 30,
    })
    const entry = await createEntry(webtoon, 'reading', 10)

    const response = await client.put(`/api/user/list/${entry.id}`).json({ chaptersRead: 31 })

    response.assertStatus(422)
    await entry.refresh()
    assert.equal(entry.chaptersRead, 10)
  })

  const invalidPayloads: Array<[string, Record<string, unknown>]> = [
    ['statut invalide', { status: 'finished' }],
    ['note superieure a 10', { rating: 11 }],
    ['note negative', { rating: -0.5 }],
    ['date invalide', { startedAt: 'pas une date' }],
  ]
  for (const [label, payload] of invalidPayloads) {
    test(`PUT /api/user/list/:id renvoie 422 : ${label}`, async ({ client, assert }) => {
      const webtoon = await Webtoon.create({ title: `Liste PUT 422 ${label}`, author: 'Test' })
      const entry = await createEntry(webtoon, 'reading', 2)

      const response = await client.put(`/api/user/list/${entry.id}`).json(payload)

      response.assertStatus(422)
      await entry.refresh()
      assert.equal(entry.status, 'reading')
      assert.isNull(entry.rating)
    })
  }

  test('PUT /api/user/list/:id renvoie 404 pour un id inconnu', async ({ client }) => {
    const response = await client.put(`/api/user/list/${UNKNOWN_ID}`).json({ status: 'reading' })

    response.assertStatus(404)
  })
})

test.group('User list API - progression (PATCH) et suppression', (group) => {
  isolateEachTest(group)

  test('PATCH /api/user/list/:id/progress met a jour chaptersRead', async ({ client, assert }) => {
    const webtoon = await Webtoon.create({
      title: 'Liste PATCH',
      author: 'Test',
      chaptersTotal: 50,
    })
    const entry = await createEntry(webtoon, 'reading', 10)

    const response = await client
      .patch(`/api/user/list/${entry.id}/progress`)
      .json({ chaptersRead: 11 })

    response.assertStatus(200)
    assert.equal(response.body().chaptersRead, 11)
    assert.equal(response.body().status, 'reading')
    assert.isNull(response.body().finishedAt)
    await entry.refresh()
    assert.equal(entry.chaptersRead, 11)
  })

  test('PATCH /api/user/list/:id/progress passe en completed avec finishedAt au dernier chapitre', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({
      title: 'Liste PATCH total',
      author: 'Test',
      chaptersTotal: 50,
    })
    const entry = await createEntry(webtoon, 'reading', 49)

    const response = await client
      .patch(`/api/user/list/${entry.id}/progress`)
      .json({ chaptersRead: 50 })

    response.assertStatus(200)
    assert.equal(response.body().status, 'completed')
    assert.equal(response.body().finishedAt, today())
    await entry.refresh()
    assert.equal(entry.status, 'completed')
    assert.equal(entry.finishedAt?.toISODate(), today())
  })

  test('PATCH /api/user/list/:id/progress refuse le depassement de chaptersTotal (422)', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({
      title: 'Liste PATCH depassement',
      author: 'Test',
      chaptersTotal: 50,
    })
    const entry = await createEntry(webtoon, 'reading', 49)

    const response = await client
      .patch(`/api/user/list/${entry.id}/progress`)
      .json({ chaptersRead: 51 })

    response.assertStatus(422)
    await entry.refresh()
    assert.equal(entry.chaptersRead, 49)
    assert.equal(entry.status, 'reading')
  })

  test('PATCH /api/user/list/:id/progress n impose aucune borne si chaptersTotal est NULL', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({ title: 'Liste PATCH sans total', author: 'Test' })
    const entry = await createEntry(webtoon, 'reading', 10)

    const response = await client
      .patch(`/api/user/list/${entry.id}/progress`)
      .json({ chaptersRead: 9999 })

    response.assertStatus(200)
    assert.equal(response.body().chaptersRead, 9999)
    assert.equal(response.body().status, 'reading')
    assert.isNull(response.body().finishedAt)
  })

  const invalidPayloads: Array<[string, Record<string, unknown>]> = [
    ['chaptersRead absent', {}],
    ['chaptersRead negatif', { chaptersRead: -1 }],
    ['chaptersRead non numerique', { chaptersRead: 'dix' }],
  ]
  for (const [label, payload] of invalidPayloads) {
    test(`PATCH /api/user/list/:id/progress renvoie 422 : ${label}`, async ({ client, assert }) => {
      const webtoon = await Webtoon.create({ title: `Liste PATCH 422 ${label}`, author: 'Test' })
      const entry = await createEntry(webtoon, 'reading', 5)

      const response = await client.patch(`/api/user/list/${entry.id}/progress`).json(payload)

      response.assertStatus(422)
      await entry.refresh()
      assert.equal(entry.chaptersRead, 5)
    })
  }

  test('PATCH /api/user/list/:id/progress renvoie 404 pour un id inconnu', async ({ client }) => {
    const response = await client
      .patch(`/api/user/list/${UNKNOWN_ID}/progress`)
      .json({ chaptersRead: 1 })

    response.assertStatus(404)
  })

  test('DELETE /api/user/list/:id supprime l entree (204) sans toucher au webtoon', async ({
    client,
    assert,
  }) => {
    const webtoon = await Webtoon.create({ title: 'Liste DELETE', author: 'Test' })
    const entry = await createEntry(webtoon)

    const response = await client.delete(`/api/user/list/${entry.id}`)

    response.assertStatus(204)
    assert.isNull(await UserWebtoon.find(entry.id))
    assert.exists(await Webtoon.find(webtoon.id))
  })

  test('DELETE /api/user/list/:id renvoie 404 pour un id inconnu', async ({ client }) => {
    const response = await client.delete(`/api/user/list/${UNKNOWN_ID}`)

    response.assertStatus(404)
  })
})
