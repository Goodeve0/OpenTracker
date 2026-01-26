import Router from '@koa/router'
import statsController from '../controllers/statsController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = new Router()

router.get('/api/stats', authMiddleware, async (ctx) => {
  await statsController.getStats(ctx)
})

export default router
