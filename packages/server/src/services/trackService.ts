import { IErrorlog, IBehaviorLog, IPerformanceLog, IBlankScreenLog } from '../types'
import prisma from '../lib/prisma'

class TrackService {
  //分类处理
  async handleReport(type: string, data: any) {
    // SDK/客户端可能上传 time / timestamp（毫秒或秒），这里做兼容
    const rawTime = data?.time ?? data?.timestamp
    let timeMs: number | undefined
    if (typeof rawTime === 'number') timeMs = rawTime
    if (typeof rawTime === 'string' && rawTime.trim() !== '') timeMs = Number(rawTime)
    // 兼容「秒级时间戳」
    if (typeof timeMs === 'number' && Number.isFinite(timeMs) && timeMs > 0 && timeMs < 1e12) {
      timeMs = timeMs * 1000
    }
    const timestamp =
      typeof timeMs === 'number' && Number.isFinite(timeMs) ? new Date(timeMs) : new Date()

    // project_id 兼容：有的 SDK 传 project_id，有的传 apiKey/_apiKey
    const projectId = data?.project_id ?? data?.apiKey ?? data?._apiKey

    switch (type) {
      case 'error':
        await prisma.error.create({
          data: {
            errorType: data.errorType,
            message: data.message,
            stack: data.stack,
            pageUrl: data.pageUrl,
            userAgent: data.userAgent,
            timestamp,
            extra: JSON.stringify(data),
            project_id: projectId,
          },
        })
        break

      case 'behavior':
        await prisma.behavior.create({
          data: {
            event: data.event,
            target: data.target,
            pageUrl: data.pageUrl,
            userAgent: data.userAgent,
            timestamp,
            extra: JSON.stringify(data),
            project_id: projectId,
          },
        })
        break

      case 'performance':
        await prisma.performance.create({
          data: {
            loadTime: data.loadTime,
            domReady: data.domReady,
            firstPaint: data.firstPaint,
            pageUrl: data.pageUrl,
            timestamp,
            extra: JSON.stringify(data),
            project_id: projectId,
          },
        })
        break

      case 'blank':
        await prisma.blank_Screen.create({
          data: {
            isBlank: data.isBlank,
            checkPoints: data.checkPoints,
            pageUrl: data.pageUrl,
            timestamp,
            extra: JSON.stringify(data),
            project_id: projectId,
          },
        })
        break
      default:
        console.warn('未知上报类型：', type)
    }

    // 统一记录一份到 Track_Event，用于访客趋势 / 设备分布 / PV 等统计
    if (['error', 'behavior', 'performance', 'blank'].includes(type)) {
      try {
        // raw_data 字段限制254字符，截断处理
        const rawDataStr = JSON.stringify(data)
        const truncatedRawData =
          rawDataStr.length > 250 ? rawDataStr.slice(0, 250) + '...' : rawDataStr

        await prisma.track_Event.create({
          data: {
            project_id: projectId,
            type,
            event_name: data.eventName || data.event || type,
            user_id: data.userId || data.user_id || null,
            page_url: data.page || data.pageUrl || data.page_url || null,
            sdk_version: data.sdkVersion || data.sdk_version || null,
            ua: data.userAgent || data.ua || null,
            created_at: timestamp,
            raw_data: truncatedRawData,
          },
        })
      } catch (e) {
        console.error('写入 Track_Event 失败:', e)
        // 不抛出错误，避免影响主流程
      }
    }
  }

  //批量处理
  async handleBatch(reports: { type: string; data: any }[]) {
    await Promise.all(reports.map((item) => this.handleReport(item.type, item.data)))
  }

  async queryLogs(params: {
    category: 'error' | 'behavior' | 'performance' | 'blank'
    startTime?: number
    endTime?: number
    keyword?: string // 搜索关键字
    page?: number // 页码（默认 1）
    pageSize?: number // 每页数量（默认 20）
  }) {
    const { category, startTime, endTime, keyword, page = 1, pageSize = 20 } = params

    const skip = (page - 1) * pageSize
    const take = pageSize

    const timeFilter =
      startTime || endTime
        ? {
            gte: startTime ? new Date(startTime) : undefined,
            lte: endTime ? new Date(endTime) : undefined,
          }
        : undefined

    let result

    // 根据分类确定数据源
    switch (category) {
      case 'error':
        result = await this.queryError({ timeFilter, keyword, skip, take })
        break

      case 'behavior':
        result = await this.queryBehavior({ timeFilter, keyword, skip, take })
        break

      case 'performance':
        result = await this.queryPerformance({ timeFilter, skip, take })
        break

      case 'blank':
        result = await this.queryBlank({ timeFilter, skip, take })
        break

      default:
        // 如果分类不存在，返回空结构
        return {
          total: 0,
          page,
          pageSize,
          list: [],
        }
    }
    return {
      total: result.total,
      page,
      pageSize,
      list: result.list,
    }
  }
  private async queryError({ timeFilter, keyword, skip, take }: any) {
    const where: any = {
      timestamp: timeFilter,
    }

    if (keyword) {
      where.OR = [
        { message: { contains: keyword } },
        { errorType: { contains: keyword } },
        { pageUrl: { contains: keyword } },
      ]
    }

    const [total, list] = await Promise.all([
      prisma.error.count({ where }),
      prisma.error.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
    ])

    return { total, list }
  }

  private async queryBehavior({ timeFilter, keyword, skip, take }: any) {
    const where: any = {
      timestamp: timeFilter,
    }

    if (keyword) {
      where.OR = [
        { event: { contains: keyword } },
        { target: { contains: keyword } },
        { pageUrl: { contains: keyword } },
      ]
    }

    const [total, list] = await Promise.all([
      prisma.behavior.count({ where }),
      prisma.behavior.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
    ])

    return { total, list }
  }

  private async queryPerformance({ timeFilter, skip, take }: any) {
    const where: any = {
      timestamp: timeFilter,
    }

    const [total, list] = await Promise.all([
      prisma.performance.count({ where }),
      prisma.performance.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
    ])

    return { total, list }
  }

  private async queryBlank({ timeFilter, skip, take }: any) {
    const where: any = {}
    if (timeFilter && (timeFilter.gte != null || timeFilter.lte != null)) {
      const gte = timeFilter.gte != null ? new Date(timeFilter.gte) : null
      const lte = timeFilter.lte != null ? new Date(timeFilter.lte) : null
      const gteValid = gte != null && !Number.isNaN(gte.getTime())
      const lteValid = lte != null && !Number.isNaN(lte.getTime())
      // 用 UTC 日期字符串构造范围，避免 @db.Date 与本地时区比较漏数据
      if (gteValid || lteValid) {
        where.timestamp = {}
        if (gteValid) {
          const day = gte!.toISOString().slice(0, 10)
          where.timestamp.gte = new Date(day + 'T00:00:00.000Z')
        }
        if (lteValid) {
          const day = lte!.toISOString().slice(0, 10)
          where.timestamp.lte = new Date(day + 'T23:59:59.999Z')
        }
      }
    }

    const [total, list] = await Promise.all([
      prisma.blank_Screen.count({ where }),
      prisma.blank_Screen.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
    ])

    return { total, list }
  }
}

export default new TrackService()
