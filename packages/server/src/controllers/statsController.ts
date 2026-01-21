import { Context } from 'koa'
import statsService from '../services/statsService'

class StatsController {
  async getStats(ctx: Context) {
    const { type, startTime, endTime } = ctx.request.query

    if (!type) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '缺少type参数',
        timestamp: new Date().toISOString(),
      }
      return
    }

    const data = await statsService.getStats({
      type: type as string,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    })

    ctx.body = {
      code: 200,
      message: '获取成功',
      data,
      timeStamp: new Date().toISOString(),
    }
  }
}

export default new StatsController()
