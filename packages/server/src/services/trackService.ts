import { IErrorlog, IBehaviorLog, IPerformanceLog, IBlankScreenLog } from '../types'
import prisma from '../lib/prisma'

class TrackService {
  //分类处理
  async handleReport(type: string, data: any) {
    const timestamp = data.time ? new Date(data.time) : new Date()

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
            extra: data,
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
            extra: data,
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
            extra: data,
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
            extra: data,
          },
        })
        break
      default:
        console.warn('未知上报类型：', type)
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
    const where: any = {
      timestamp: timeFilter,
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
