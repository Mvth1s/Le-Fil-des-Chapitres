import { test } from '@japa/runner'

test.group('Genres API', () => {
  test('GET /api/genres renvoie les 14 genres seedes', async ({ client, assert }) => {
    const response = await client.get('/api/genres')

    response.assertStatus(200)
    assert.lengthOf(response.body(), 14)
  })
})
