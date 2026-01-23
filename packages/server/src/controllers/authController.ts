import { Context } from 'koa'
import bcrypt from 'bcryptjs'
import { IRegisterRequest, ILoginRequest, IApiResponse, IAuthResponse } from '../types'
import { validatePassword, validateUsername } from '../utils/validation'
import { JWTUtil, TokenPayload } from '../utils/jwt'
import prisma from '../lib/prisma'

class AuthController {
  constructor() {
    // 绑定方法到当前实例
    this.register = this.register.bind(this)
    this.login = this.login.bind(this)
    this.changePassword = this.changePassword.bind(this)
  }
  // 用户注册
  async register(ctx: Context): Promise<void> {
    const { username, password } = ctx.request.body as { username: string; password: string }

    console.log('注册请求:', { username, password: '***' })

    // 数据验证
    if (!username || !password) {
      ctx.status = 400
      ctx.body = this.createResponse(400, '用户名、密码为必填项')
      return
    }

    if (!validateUsername(username)) {
      ctx.status = 400
      ctx.body = this.createResponse(400, '用户名长度需在3-20位之间')
      return
    }

    if (!validatePassword(password)) {
      ctx.status = 400
      ctx.body = this.createResponse(400, '密码必须至少6位')
      return
    }

    try {
      // 检查用户是否已存在
      const existingUser = await prisma.users.findFirst({
        where: { username },
      })
      if (existingUser) {
        ctx.status = 409
        ctx.body = this.createResponse(409, '用户名已存在')
        return
      }

      // 创建用户
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.users.create({
        data: {
          username,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      console.log('新用户注册成功:', username, '用户ID:', user.id)

      // 生成 Token
      const tokenPayload: TokenPayload = {
        userId: user.id.toString(),
        username: user.username || '',
        name: user.name || undefined,
      }
      const token = JWTUtil.generateToken(tokenPayload)

      // 返回用户信息和token
      const responseData: IAuthResponse = {
        user: {
          id: user.id.toString(),
          username: user.username || '',
          name: user.name || undefined,
          email: user.email || undefined,
          phone: user.telephone_number?.toString(),
        },
        token,
        expiresIn: '7d',
      }

      ctx.body = this.createResponse(200, '注册成功', responseData)
    } catch (error) {
      console.error('注册错误:', error)
      ctx.status = 500
      ctx.body = this.createResponse(500, '服务器内部错误')
    }
  }

  // 用户登录
  async login(ctx: Context): Promise<void> {
    const { login, password } = ctx.request.body as ILoginRequest

    console.log('登录请求:', { login, password: '***' })

    if (!login || !password) {
      ctx.status = 400
      ctx.body = this.createResponse(400, '用户名和密码为必填项')
      return
    }

    try {
      // 查找用户
      const user = await prisma.users.findFirst({
        where: { username: login },
      })
      if (!user) {
        ctx.status = 401
        ctx.body = this.createResponse(401, '用户不存在')
        return
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password || '')
      if (!isValidPassword) {
        ctx.status = 401
        ctx.body = this.createResponse(401, '密码错误')
        return
      }

      console.log('用户登录成功:', user.username, '用户ID:', user.id)

      // 生成 Token
      const tokenPayload: TokenPayload = {
        userId: user.id.toString(),
        username: user.username || '',
        name: user.name || undefined,
      }
      const token = JWTUtil.generateToken(tokenPayload)

      // 返回用户信息和token
      const responseData: IAuthResponse = {
        user: {
          id: user.id.toString(),
          username: user.username || '',
          name: user.name || undefined,
          email: user.email || undefined,
          phone: user.telephone_number?.toString(),
        },
        token,
        expiresIn: '7d',
      }

      ctx.body = this.createResponse(200, '登录成功', responseData)
    } catch (error) {
      console.error('登录错误:', error)
      ctx.status = 500
      ctx.body = this.createResponse(500, '服务器内部错误')
    }
  }

  // 修改密码
  async changePassword(ctx: Context): Promise<void> {
    const userInfo = ctx.state.user
    const { currentPassword, newPassword } = ctx.request.body as {
      currentPassword: string
      newPassword: string
    }

    console.log('修改密码请求:', { userId: userInfo.userId, password: '***' })

    // 数据验证
    if (!currentPassword || !newPassword) {
      ctx.status = 400
      ctx.body = this.createResponse(400, '当前密码和新密码为必填项')
      return
    }

    if (!validatePassword(newPassword)) {
      ctx.status = 400
      ctx.body = this.createResponse(400, '密码必须至少6位')
      return
    }

    try {
      // 查找用户
      const user = await prisma.users.findUnique({
        where: { id: parseInt(userInfo.userId) },
      })
      if (!user) {
        ctx.status = 404
        ctx.body = this.createResponse(404, '用户不存在')
        return
      }

      // 验证当前密码
      const isValidPassword = await bcrypt.compare(currentPassword, user.password || '')
      if (!isValidPassword) {
        ctx.status = 401
        ctx.body = this.createResponse(401, '当前密码错误')
        return
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // 更新密码
      await prisma.users.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      })

      console.log('用户密码修改成功:', user.username, '用户ID:', user.id)

      ctx.body = this.createResponse(200, '密码修改成功')
    } catch (error) {
      console.error('修改密码错误:', error)
      ctx.status = 500
      ctx.body = this.createResponse(500, '服务器内部错误')
    }
  }

  private createResponse<T>(code: number, message: string, data?: T): IApiResponse<T> {
    return {
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  }
}

export default new AuthController()
