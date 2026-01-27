import { Context } from 'koa'
import { randomBytes } from 'crypto'
import { PrismaClient } from '@prisma/client'

// 尝试创建 Prisma 客户端实例
let prisma: PrismaClient

try {
  prisma = new PrismaClient()
} catch (error) {
  console.error('创建 Prisma 客户端失败:', error)
  // 如果创建失败，使用空对象作为占位符
  prisma = {} as PrismaClient
}

// 移除类型接口，直接使用类型断言

// 生成随机 API Key
const generateApiKey = (): string => {
  return randomBytes(32).toString('hex')
}

// 请求体类型
interface CreateProjectBody {
  name: string
  url: string
  type: string
  apiKey?: string
  description?: string
}

interface UpdateProjectBody {
  name?: string
  url?: string
  type?: string
  description?: string
}

interface UpdateMonitorStatusBody {
  monitorStatus: string
}

// 创建项目
const createProject = async (ctx: Context) => {
  try {
    const { name, url, type, apiKey, description } = ctx.request.body as CreateProjectBody
    const userId = ctx.state.user.userId

    // 验证必填字段
    if (!name || !url || !type) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '缺少必填字段',
      }
      return
    }

    // 生成 API Key（如果未提供）
    const finalApiKey = apiKey || generateApiKey()

    // 创建项目
    const project = await (prisma as any).project.create({
      data: {
        name,
        url,
        type,
        apiKey: finalApiKey,
        description,
        userId: parseInt(userId),
      },
    })

    ctx.status = 200
    ctx.body = {
      code: 200,
      message: '项目创建成功',
      data: project,
    }
  } catch (error) {
    console.error('创建项目失败:', error)
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: '创建项目失败',
    }
  }
}

// 获取项目列表
const getProjects = async (ctx: Context) => {
  try {
    const userId = ctx.state.user.userId

    // 获取用户的所有项目
    const projects = await (prisma as any).project.findMany({
      where: {
        userId: parseInt(userId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    ctx.status = 200
    ctx.body = {
      code: 200,
      message: '获取项目列表成功',
      data: projects,
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: '获取项目列表失败',
      data: [],
    }
  }
}

// 获取项目详情
const getProjectDetail = async (ctx: Context) => {
  try {
    const { id } = ctx.params
    const userId = ctx.state.user.userId

    // 获取项目详情
    const project = await (prisma as any).project.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      },
    })

    if (!project) {
      ctx.status = 404
      ctx.body = {
        code: 404,
        message: '项目不存在',
      }
      return
    }

    ctx.status = 200
    ctx.body = {
      code: 200,
      message: '获取项目详情成功',
      data: project,
    }
  } catch (error) {
    console.error('获取项目详情失败:', error)
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: '获取项目详情失败',
    }
  }
}

// 更新项目
const updateProject = async (ctx: Context) => {
  try {
    const { id } = ctx.params
    const { name, url, type, description } = ctx.request.body as UpdateProjectBody
    const userId = ctx.state.user.userId

    // 检查项目是否存在
    const project = await (prisma as any).project.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      },
    })

    if (!project) {
      ctx.status = 404
      ctx.body = {
        code: 404,
        message: '项目不存在',
      }
      return
    }

    // 更新项目
    const updatedProject = await (prisma as any).project.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name: name || project.name,
        url: url || project.url,
        type: type || project.type,
        description: description || project.description,
      },
    })

    ctx.status = 200
    ctx.body = {
      code: 200,
      message: '更新项目成功',
      data: updatedProject,
    }
  } catch (error) {
    console.error('更新项目失败:', error)
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: '更新项目失败',
    }
  }
}

// 删除项目
const deleteProject = async (ctx: Context) => {
  try {
    const { id } = ctx.params
    const userId = ctx.state.user.userId

    // 检查项目是否存在
    const project = await (prisma as any).project.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      },
    })

    if (!project) {
      ctx.status = 404
      ctx.body = {
        code: 404,
        message: '项目不存在',
      }
      return
    }

    // 删除项目
    await (prisma as any).project.delete({
      where: {
        id: parseInt(id),
      },
    })

    ctx.status = 200
    ctx.body = {
      code: 200,
      message: '删除项目成功',
    }
  } catch (error) {
    console.error('删除项目失败:', error)
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: '删除项目失败',
    }
  }
}

// 更新项目监控状态
const updateMonitorStatus = async (ctx: Context) => {
  try {
    const { id } = ctx.params
    const { monitorStatus } = ctx.request.body as UpdateMonitorStatusBody
    const userId = ctx.state.user.userId

    // 检查项目是否存在
    const project = await (prisma as any).project.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      },
    })

    if (!project) {
      ctx.status = 404
      ctx.body = {
        code: 404,
        message: '项目不存在',
      }
      return
    }

    // 更新监控状态
    const updatedProject = await (prisma as any).project.update({
      where: {
        id: parseInt(id),
      },
      data: {
        monitorStatus,
      },
    })

    ctx.status = 200
    ctx.body = {
      code: 200,
      message: '更新监控状态成功',
      data: updatedProject,
    }
  } catch (error) {
    console.error('更新监控状态失败:', error)
    ctx.status = 500
    ctx.body = {
      code: 500,
      message: '更新监控状态失败',
    }
  }
}

export default {
  createProject,
  getProjects,
  getProjectDetail,
  updateProject,
  deleteProject,
  updateMonitorStatus,
}
