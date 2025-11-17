import Koa from 'koa'
import bodyParser from 'koa-bodyParser'

//创建koa实例
const app = new Koa()

//使用中间件，让Koa能解析请求body
app.use(bodyParser())

//注册一个简易的中间件，当收到请求时返回字符串
app.use((ctx) => {
  ctx.body = 'Koa backend running'
})

//启动服务器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log('服务器运行在http://localhost:', PORT)
})
