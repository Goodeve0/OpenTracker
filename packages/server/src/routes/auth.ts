import Router from '@koa/router'
import authController from '../controllers/authController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = new Router()

// 用户注册
router.post('/api/auth/register', authController.register.bind(authController))

// 用户登录
router.post('/api/auth/login', authController.login.bind(authController))

// 修改密码
router.post(
  '/api/auth/change-password',
  authMiddleware,
  authController.changePassword.bind(authController)
)

export default router
