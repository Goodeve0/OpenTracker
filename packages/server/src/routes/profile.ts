import Router from '@koa/router'
import { authMiddleware } from '../middleware/authMiddleware'
const router = new Router()

const createResponse = <T>(code: number, message: string, data?: T) => {
  return {
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

// 获取用户个人信息（需要 Token 验证）
router.get('/api/profile', authMiddleware, (ctx) => {
  const user = ctx.state.user // 从中间件获取用户信息

  console.log('获取用户信息，当前用户:', user)

  ctx.body = createResponse(200, '获取个人信息成功', {
    user: {
      id: user.userId,
      username: user.username,
    },
    message: '这是一个受 Token 保护的接口',
  })
})

// 更新用户信息（需要 Token 验证）
router.put('/api/profile', authMiddleware, (ctx) => {
  const user = ctx.state.user

  ctx.body = createResponse(200, '更新个人信息成功', {
    user: {
      id: user.userId,
      username: user.username,
    },
    updatedAt: new Date().toISOString(),
  })
})

export default router
