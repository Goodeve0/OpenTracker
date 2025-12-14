import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'
import trackRouter from './routes/track'

//创建koa实例
const app = new Koa()

//中间件配置
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
)
app.use(
  bodyParser({
    enableTypes: ['json'],
    jsonLimit: '10mb',
    strict: false,
  })
)

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error('服务器错误:', error)
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: '服务器内部错误',
      timestamp: new Date().toISOString(),
    }
  }
})

// 健康检查接口
app.use(async (ctx, next) => {
  if (ctx.path === '/health' || ctx.path === '/') {
    ctx.body = {
      code: 200,
      message: '认证服务正常运行',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    }
    return
  }
  await next()
})

// 注册路由
app.use(authRoutes.routes())
app.use(authRoutes.allowedMethods()) // 正确处理 405 等方法错误

app.use(profileRoutes.routes())
app.use(profileRoutes.allowedMethods())

app.use(trackRouter.routes())
app.use(trackRouter.allowedMethods())

//启动服务器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log('服务器运行在http://localhost:', PORT)
})

export default app
