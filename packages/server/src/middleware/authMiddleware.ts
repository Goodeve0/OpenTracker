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

  console.log('=== Token 验证开始 ===')
  console.log('Authorization 头:', authHeader)

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('未提供 Token 或格式错误')
    ctx.status = 401
    ctx.body = createResponse(401, '未提供认证令牌')
    return
  }

  const token = authHeader.slice(7)
  console.log('提取的 Token:', token ? `${token.substring(0, 10)}...` : '空')

  try {
    const payload = JWTUtil.verifyToken(token)
    console.log('Token 验证成功，用户:', payload)
    ctx.state.user = payload // 将用户信息存入 ctx.state
    await next()
  } catch (error) {
    console.error('Token 验证失败:', error)
    ctx.status = 401
    ctx.body = createResponse(401, '令牌无效或已过期')
  }
}
