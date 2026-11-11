/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import { middleware } from '#start/kernel'
const WebtoonsController = () => import('#controllers/webtoons_controller')
const GenresController = () => import('#controllers/genres_controller')
const UserListController = () => import('#controllers/user_list_controller')
const StatsController = () => import('#controllers/stats_controller')

/*
| Public health check (UptimeRobot, alwaysdata), outside /api so it needs
| no X-Api-Key. Reports only up/down: no version, no error detail.
*/
router.get('/health', async ({ response }) => {
  try {
    await db.rawQuery('SELECT 1')
    return { status: 'ok' }
  } catch (error) {
    logger.error({ err: error }, 'health check: database unreachable')
    return response.serviceUnavailable({ status: 'error' })
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
  .use(middleware.apiKey())
  // A non-UUID :id matches no route (404) instead of reaching PostgreSQL (500).
  // Strict hex regex: router.matchers.uuid() uses [0-9a-zA-F], which lets 'zzzzzzzz-...' through.
  .where('id', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
