import { Context } from 'koa'
import trackService from '../services/trackService'

interface ReportBody {
  type: string
  data: any
}

class TrackController {
  // 统一上报接口
  async report(ctx: Context) {
    const body = ctx.request.body

    if (Array.isArray(body)) {
      trackService.handleBatch(body)
      ctx.body = {
        code: 200,
        message: '批量上报成功',
        count: body.length,
      }
      return
    }

    const { type, data } = ctx.request.body as ReportBody

    if (!type || !data) {
      ctx.status = 400
      ctx.body = {
        code: 400,
        message: '参数错误：缺少 type 或 data',
      }
      return
    }

    trackService.handleReport(type, data)

    ctx.body = {
      code: 200,
      message: '上报成功',
    }
  }

  //查询接口
  async query(ctx: Context) {
    // 从 querystring 中解析请求参数
    const { category, startTime, endTime, keyword, page, pageSize } = ctx.request.query

    // 调用 Service 层进行查询
    const result = trackService.queryLogs({
      category: category as any,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
      keyword: keyword as string,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    })

    ctx.body = result
  }
}

export default new TrackController()
