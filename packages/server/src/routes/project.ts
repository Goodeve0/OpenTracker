import Router from 'koa-router'
import projectController from '../controllers/projectController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = new Router()

// 应用认证中间件
router.use(authMiddleware)

// 项目相关路由
router.post('/api/project/create', projectController.createProject)
router.get('/api/project/list', projectController.getProjects)
router.get('/api/project/detail/:id', projectController.getProjectDetail)
router.put('/api/project/update/:id', projectController.updateProject)
router.delete('/api/project/delete/:id', projectController.deleteProject)
router.put('/api/project/monitor/:id', projectController.updateMonitorStatus)

export default router
