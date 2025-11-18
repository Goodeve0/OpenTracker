// mock/middleware.js
module.exports = (req, res, next) => {
  // 仅拦截登录相关的 GET 请求（带 username 和 password 参数）
  if (req.method === 'GET' && req.path === '/users' && req.query.username && req.query.password) {
    const { username, password } = req.query
    // 读取 db 中的用户数据
    const users = req.app.db.get('users').value()
    // 匹配用户名和密码
    const matchedUser = users.find((u) => u.username === username && u.password === password)

    if (matchedUser && users) {
      // 登录成功：返回 200 + 用户数据
      res.status(200).json([matchedUser])
    } else {
      // 登录失败：返回 401 + 错误信息
      res.status(401).json({ error: '用户名或密码错误' })
    }
    return // 拦截后续中间件，直接返回结果
  }
  next() // 非登录请求，继续执行后续中间件
}
