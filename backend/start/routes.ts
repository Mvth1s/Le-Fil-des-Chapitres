/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const WebtoonsController = () => import('#controllers/webtoons_controller')
const GenresController = () => import('#controllers/genres_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    router.get('/webtoons', [WebtoonsController, 'index'])
    router.get('/webtoons/:id', [WebtoonsController, 'show'])
    router.post('/webtoons', [WebtoonsController, 'store'])
    router.put('/webtoons/:id', [WebtoonsController, 'update'])
    router.delete('/webtoons/:id', [WebtoonsController, 'destroy'])

    router.get('/genres', [GenresController, 'index'])
  })
  .prefix('/api')
