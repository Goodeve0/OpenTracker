import Router from '@koa/router'
import trackController from '../controllers/trackController'

const router = new Router({ prefix: '/api/track' })

// POST /api/track/report
router.post('/report', trackController.report)

//GET /api/track/query
router.get('/query', trackController.query)

export default router
