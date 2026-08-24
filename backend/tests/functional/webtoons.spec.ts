import { test } from '@japa/runner'

test.group('Webtoons API', () => {
  test('GET /api/webtoons renvoie 200 et un tableau', async ({ client, assert }) => {
    const response = await client.get('/api/webtoons')

    response.assertStatus(200)
    assert.isArray(response.body())
  })

  test('GET /api/webtoons/:id renvoie 404 pour un id inconnu', async ({ client }) => {
    const response = await client.get('/api/webtoons/00000000-0000-0000-0000-000000000000')

    response.assertStatus(404)
  })
})
