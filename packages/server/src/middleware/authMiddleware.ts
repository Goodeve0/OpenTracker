import { Context, Next } from 'koa'
import { JWTUtil } from '../utils/jwt'

const createResponse = <T>(code: number, message: string, data?: T) => {
  return {
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

export const authMiddleware = async (ctx: Context, next: Next) => {
  const authHeader = ctx.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401
    ctx.body = createResponse(401, '未提供认证令牌')
    return
  }

  const token = authHeader.slice(7)

  try {
    const payload = JWTUtil.verifyToken(token)
    ctx.state.user = payload // 将用户信息存入 ctx.state
    await next()
  } catch (error) {
    ctx.status = 401
    ctx.body = createResponse(401, '令牌无效或已过期')
  }
}
