import Router from '@koa/router'
import { authMiddleware } from '../middleware/authMiddleware'
import prisma from '../lib/prisma'
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
router.get('/api/profile', authMiddleware, async (ctx) => {
  const userInfo = ctx.state.user // 从中间件获取用户信息

  console.log('获取用户信息，当前用户:', userInfo)

  try {
    // 从数据库获取完整用户信息
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userInfo.userId) },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        telephone_number: true,
        gender: true,
        age: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      ctx.status = 404
      ctx.body = createResponse(404, '用户不存在')
      return
    }

    ctx.body = createResponse(200, '获取个人信息成功', {
      user: {
        id: user.id.toString(),
        username: user.username || '',
        name: user.name,
        email: user.email,
        phone: user.telephone_number?.toString(),
        gender: user.gender,
        age: user.age,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error('获取个人信息错误:', error)
    ctx.status = 500
    ctx.body = createResponse(500, '服务器内部错误')
  }
})

// 更新用户信息请求体类型
interface UpdateProfileRequest {
  username?: string
  name?: string
  email?: string
  phone?: string
  gender?: string
  age?: number
  bio?: string
  avatar?: string
}

// 更新用户信息（需要 Token 验证）
router.put('/api/profile', authMiddleware, async (ctx) => {
  const userInfo = ctx.state.user
  const { username, name, email, phone, gender, age, bio, avatar } = ctx.request
    .body as UpdateProfileRequest

  console.log('更新用户信息，当前用户:', userInfo, '更新数据:', {
    username,
    name,
    email,
    phone,
    gender,
    age,
    bio,
    avatar,
  })

  try {
    // 如果更新用户名，检查是否已存在
    if (username && username !== userInfo.username) {
      const existingUser = await prisma.users.findFirst({
        where: { username },
      })
      if (existingUser) {
        ctx.status = 409
        ctx.body = createResponse(409, '用户名已存在')
        return
      }
    }

    // 准备更新数据，将phone映射为telephone_number
    const userUpdateData: any = {
      updatedAt: new Date(),
    }

    if (username !== undefined) {
      userUpdateData.username = username
    }
    if (name !== undefined) {
      userUpdateData.name = name
    }
    if (email !== undefined) {
      userUpdateData.email = email
    }
    if (phone !== undefined) {
      userUpdateData.telephone_number = phone ? parseInt(phone) : undefined
    }
    if (gender !== undefined) {
      userUpdateData.gender = gender
    }
    if (age !== undefined) {
      userUpdateData.age = age
    }
    if (bio !== undefined) {
      userUpdateData.bio = bio
    }
    if (avatar !== undefined) {
      userUpdateData.avatar = avatar
    }

    // 更新用户信息
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userInfo.userId) },
      data: userUpdateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        telephone_number: true,
        gender: true,
        age: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    ctx.body = createResponse(200, '更新个人信息成功', {
      user: {
        id: updatedUser.id.toString(),
        username: updatedUser.username || '',
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.telephone_number?.toString(),
        gender: updatedUser.gender,
        age: updatedUser.age,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      updatedAt: updatedUser.updatedAt,
    })
  } catch (error) {
    console.error('更新个人信息错误:', error)
    ctx.status = 500
    ctx.body = createResponse(500, '服务器内部错误')
  }
})

export default router
