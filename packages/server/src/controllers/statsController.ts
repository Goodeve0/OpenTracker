import { Context } from 'koa'
import statsService from '../services/statsService'

class StatsController {
  async getStats(ctx: Context) {
    const { type, startTime, endTime, limit } = ctx.request.query
    // 从中间件获取用户信息
    const userInfo = ctx.state.user

    if (!type) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '缺少type参数',
        timestamp: new Date().toISOString(),
      }
      return
    }

    // 验证startTime和endTime是否为有效数字
    if (startTime && isNaN(Number(startTime))) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: 'startTime必须为有效数字',
        timestamp: new Date().toISOString(),
      }
      return
    }

    if (endTime && isNaN(Number(endTime))) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: 'endTime必须为有效数字',
        timestamp: new Date().toISOString(),
      }
      return
    }

    // 验证limit是否为有效数字
    if (limit && isNaN(Number(limit))) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: 'limit必须为有效数字',
        timestamp: new Date().toISOString(),
      }
      return
    }

    try {
      const data = await statsService.getStats({
        type: type as string,
        startTime: startTime ? Number(startTime) : undefined,
        endTime: endTime ? Number(endTime) : undefined,
        limit: limit ? Number(limit) : undefined,
        userId: userInfo.userId, // 传递用户ID
      })

      ctx.body = {
        code: 200,
        message: '获取成功',
        data,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`获取统计数据失败，类型：${type}，错误：`, error)
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: error instanceof Error ? error.message : '获取统计数据失败',
        timestamp: new Date().toISOString(),
      }
    }
  }
}

export default new StatsController()
