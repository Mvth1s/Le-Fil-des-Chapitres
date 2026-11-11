import { randomBytes } from 'node:crypto'
import { test } from '@japa/runner'
import env from '#start/env'

/*
| The middleware reads env.get('API_KEY') on every request, so each test sets
| its own value and the group restores the original one after each test,
| even when the test fails.
*/
function useApiKey(value: string | undefined) {
  env.set('API_KEY', value)
  // env.set writes process.env too, where undefined would become "undefined".
  if (value === undefined) delete process.env.API_KEY
}

test.group('X-Api-Key middleware', (group) => {
  group.each.setup(() => {
    const original = env.get('API_KEY')
    return () => useApiKey(original)
  })

  test('sans en-tete X-Api-Key renvoie 401', async ({ client, assert }) => {
    useApiKey(randomBytes(32).toString('hex'))

    const response = await client.get('/api/genres')

    response.assertStatus(401)
    assert.deepEqual(response.body(), { message: 'Unauthorized' })
  })

  test('mauvaise cle de meme longueur renvoie 401', async ({ client, assert }) => {
    useApiKey(randomBytes(32).toString('hex'))

    const response = await client
      .get('/api/genres')
      .header('x-api-key', randomBytes(32).toString('hex'))

    response.assertStatus(401)
    assert.deepEqual(response.body(), { message: 'Unauthorized' })
  })

  test('cle de longueur differente renvoie 401 sans erreur', async ({ client, assert }) => {
    const key = randomBytes(32).toString('hex')
    useApiKey(key)

    const response = await client.get('/api/genres').header('x-api-key', key.slice(0, 10))

    response.assertStatus(401)
    assert.deepEqual(response.body(), { message: 'Unauthorized' })
  })

  test('bonne cle renvoie 200', async ({ client }) => {
    const key = randomBytes(32).toString('hex')
    useApiKey(key)

    const response = await client.get('/api/genres').header('x-api-key', key)

    response.assertStatus(200)
  })

  test('sans API_KEY les routes /api repondent sans cle', async ({ client }) => {
    useApiKey(undefined)

    const response = await client.get('/api/genres')

    response.assertStatus(200)
  })

  test('/health reste public quand API_KEY est defini', async ({ client, assert }) => {
    useApiKey(randomBytes(32).toString('hex'))

    const response = await client.get('/health')

    response.assertStatus(200)
    assert.deepEqual(response.body(), { status: 'ok' })
  })
})

test.group('Health check', () => {
  test('GET /health renvoie exactement { status: ok }', async ({ client, assert }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    // deepEqual on the whole body: no version or any other field leaks.
    assert.deepEqual(response.body(), { status: 'ok' })
  })
})
