import { test } from '@japa/runner'
import Webtoon from '#models/webtoon'

const UNSAFE_URLS = [
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'ftp://example.com/x',
]

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

  test('GET /api/webtoons/:id renvoie 404 pour un id non UUID', async ({ client }) => {
    const response = await client.get('/api/webtoons/abc')

    response.assertStatus(404)
  })
})

test.group('Webtoons API - protocoles des URL', () => {
  for (const field of ['link', 'coverUrl']) {
    for (const url of UNSAFE_URLS) {
      test(`POST /api/webtoons refuse ${field} = ${url}`, async ({ client }) => {
        const response = await client
          .post('/api/webtoons')
          .json({ title: `Test protocole ${field} ${url}`, author: 'Test', [field]: url })

        response.assertStatus(422)
      })
    }

    test(`PUT /api/webtoons/:id refuse ${field} = javascript:`, async ({ client }) => {
      const webtoon = await Webtoon.create({ title: `Test PUT protocole ${field}`, author: 'Test' })
      try {
        const response = await client
          .put(`/api/webtoons/${webtoon.id}`)
          .json({ title: webtoon.title, author: 'Test', [field]: 'javascript:alert(1)' })

        response.assertStatus(422)
      } finally {
        await webtoon.delete()
      }
    })
  }

  test('POST /api/webtoons accepte des URL https', async ({ client }) => {
    const response = await client.post('/api/webtoons').json({
      title: 'Test protocole https',
      author: 'Test',
      link: 'https://example.com/webtoon',
      coverUrl: 'https://example.com/cover.jpg',
    })
    try {
      response.assertStatus(201)
    } finally {
      await Webtoon.query().where('title', 'Test protocole https').delete()
    }
  })

  test('POST /api/webtoons refuse un coverUrl en http', async ({ client, assert }) => {
    const response = await client
      .post('/api/webtoons')
      .json({ title: 'Test cover http POST', author: 'Test', coverUrl: 'http://example.com/c.jpg' })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'coverUrl')
  })

  test('PUT /api/webtoons/:id refuse un coverUrl en http', async ({ client }) => {
    const webtoon = await Webtoon.create({ title: 'Test cover http PUT', author: 'Test' })
    try {
      const response = await client
        .put(`/api/webtoons/${webtoon.id}`)
        .json({ title: webtoon.title, author: 'Test', coverUrl: 'http://example.com/c.jpg' })

      response.assertStatus(422)
    } finally {
      await webtoon.delete()
    }
  })

  test('PUT /api/webtoons/:id accepte un coverUrl en https', async ({ client }) => {
    const webtoon = await Webtoon.create({ title: 'Test cover https PUT', author: 'Test' })
    try {
      const response = await client
        .put(`/api/webtoons/${webtoon.id}`)
        .json({ title: webtoon.title, author: 'Test', coverUrl: 'https://example.com/c.jpg' })

      response.assertStatus(200)
    } finally {
      await webtoon.delete()
    }
  })

  test('POST /api/webtoons accepte un link en http', async ({ client }) => {
    const title = 'Test link http POST'
    try {
      const response = await client
        .post('/api/webtoons')
        .json({ title, author: 'Test', link: 'http://example.com/w' })

      response.assertStatus(201)
    } finally {
      await Webtoon.query().where('title', title).delete()
    }
  })

  test('PUT /api/webtoons/:id accepte un link en http', async ({ client }) => {
    const webtoon = await Webtoon.create({ title: 'Test link http PUT', author: 'Test' })
    try {
      const response = await client
        .put(`/api/webtoons/${webtoon.id}`)
        .json({ title: webtoon.title, author: 'Test', link: 'http://example.com/w' })

      response.assertStatus(200)
    } finally {
      await webtoon.delete()
    }
  })

  test('PUT sans coverUrl laisse intact un cover_url http preexistant', async ({
    client,
    assert,
  }) => {
    const legacy = 'http://example.com/legacy.jpg'
    const webtoon = await Webtoon.create({
      title: 'Test cover legacy',
      author: 'Test',
      coverUrl: legacy,
    })
    try {
      const response = await client
        .put(`/api/webtoons/${webtoon.id}`)
        .json({ title: webtoon.title, author: 'Autre' })

      response.assertStatus(200)
      const fresh = await Webtoon.findOrFail(webtoon.id)
      assert.equal(fresh.coverUrl, legacy)
    } finally {
      await webtoon.delete()
    }
  })
})
