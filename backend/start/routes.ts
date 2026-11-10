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
const UserListController = () => import('#controllers/user_list_controller')
const StatsController = () => import('#controllers/stats_controller')

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

    router.get('/user/list', [UserListController, 'index'])
    router.post('/user/list', [UserListController, 'store'])
    router.put('/user/list/:id', [UserListController, 'update'])
    router.patch('/user/list/:id/progress', [UserListController, 'updateProgress'])
    router.delete('/user/list/:id', [UserListController, 'destroy'])

    router.get('/stats', [StatsController, 'index'])
  })
  .prefix('/api')
  // A non-UUID :id matches no route (404) instead of reaching PostgreSQL (500).
  // Strict hex regex: router.matchers.uuid() uses [0-9a-zA-F], which lets 'zzzzzzzz-...' through.
  .where('id', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
