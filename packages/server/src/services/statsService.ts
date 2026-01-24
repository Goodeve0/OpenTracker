import prisma from '../lib/prisma'

interface StatsParams {
  type: string
  startTime?: number
  endTime?: number
  limit?: number
  page?: number
  pageSize?: number
}

class StatsService {
  async getStats(params: StatsParams) {
    const { type } = params

    switch (type) {
      case 'performance_avg':
        return this.performanceAvg(params)

      case 'error_top_n':
        return this.errorTopN(params, params.limit || 5)

      case 'blank_rate':
        return this.blankRate(params)

      case 'dashboard':
        return this.dashboard(params)

      case 'visitor_trends':
        return this.visitorTrends(params)

      case 'visitor_device':
        return this.visitorDevice(params)

      case 'behavior_events':
        return this.behaviorEvents(params)

      case 'behavior_page_views':
        return this.behaviorPageViews(params)

      case 'error_trends':
        return this.errorTrends(params)

      case 'white_screen_trends':
        return this.whiteScreenTrends(params)

      case 'white_screen_top_pages':
        return this.whiteScreenTopPages(params)

      case 'high_error_pages':
        return this.highErrorPages(params)

      case 'error_list':
        return this.errorList(params)

      case 'api_errors':
        return this.errorByType(params, 'api')

      case 'js_errors':
        return this.errorByType(params, 'js')

      case 'crash_errors':
        return this.errorByType(params, '页面崩溃')

      case 'framework_errors':
        return this.errorByType(params, 'framework')

      default:
        throw new Error(`未知统计类型: ${type}`)
    }
  }
  //性能均值
  private async performanceAvg({ startTime, endTime }: StatsParams) {
    const list = await prisma.performance.findMany({
      where: {
        timestamp: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
        },
      },
      select: {
        timestamp: true,
        loadTime: true,
        firstPaint: true,
      },
    })

    const map: Record<string, { load: number[]; paint: number[] }> = {}

    list.forEach((item) => {
      if (!item.timestamp) return
      const day = item.timestamp.toISOString().slice(0, 10)

      if (!map[day]) map[day] = { load: [], paint: [] }
      if (item.loadTime) map[day].load.push(item.loadTime)
      if (item.firstPaint) map[day].paint.push(item.firstPaint)
    })

    const dates: string[] = []
    const loadTimeAvg: number[] = []
    const firstPaintAvg: number[] = []

    Object.keys(map)
      .sort()
      .forEach((day) => {
        dates.push(day)
        loadTimeAvg.push(
          Math.round(map[day].load.reduce((a, b) => a + b, 0) / (map[day].load.length || 1))
        )
        firstPaintAvg.push(
          Math.round(map[day].paint.reduce((a, b) => a + b, 0) / (map[day].paint.length || 1))
        )
      })

    return { dates, loadTimeAvg, firstPaintAvg }
  }

  //错误 Top N
  private async errorTopN({ startTime, endTime }: StatsParams, limit: number) {
    // 如果没有提供时间范围，默认查询最近24小时
    const defaultStartTime = new Date()
    defaultStartTime.setHours(defaultStartTime.getHours() - 24)

    const list = await prisma.error.groupBy({
      by: ['errorType'],
      where: {
        timestamp: {
          gte: startTime ? new Date(startTime) : defaultStartTime,
          lte: endTime ? new Date(endTime) : new Date(),
        },
      },
      _count: {
        errorType: true,
      },
      orderBy: {
        _count: {
          errorType: 'desc',
        },
      },
    })

    // 错误类型映射
    const errorTypeMap: Record<string, string> = {
      js: 'JS错误',
      api: 'API错误',
      cors: '跨域错误',
      framework: '框架错误',
      页面崩溃: '页面崩溃',
    }

    // 直接使用数据库查询结果，不进行过滤
    const formattedList = list
      .map((item) => {
        if (!item.errorType) return null

        let displayName = item.errorType
        if (errorTypeMap[item.errorType]) {
          displayName = errorTypeMap[item.errorType]
        }

        return {
          name: displayName,
          count: item._count.errorType,
        }
      })
      .filter((item): item is { name: string; count: number } => item !== null)

    return formattedList.slice(0, limit)
  }

  //白屏率
  private async blankRate({ startTime, endTime }: StatsParams) {
    const timeRange = {
      gte: startTime ? new Date(startTime) : undefined,
      lte: endTime ? new Date(endTime) : undefined,
    }

    const [blankCount, pv] = await Promise.all([
      prisma.blank_Screen.count({
        where: {
          isBlank: true,
          timestamp: timeRange,
        },
      }),
      prisma.track_Event.count({
        where: {
          created_at: timeRange,
        },
      }),
    ])

    return {
      blankCount,
      pv,
      blankRate: pv === 0 ? 0 : Number((blankCount / pv).toFixed(4)),
    }
  }

  //Dashboard聚合
  private async dashboard(params: StatsParams) {
    const [performanceAvg, errorTopN, blankRate] = await Promise.all([
      this.performanceAvg(params),
      this.errorTopN(params, 5),
      this.blankRate(params),
    ])

    return {
      performanceAvg,
      errorTopN,
      blankRate,
    }
  }

  //访客趋势
  private async visitorTrends({ startTime, endTime }: StatsParams) {
    const list = await prisma.track_Event.groupBy({
      by: ['created_at'],
      where: {
        created_at: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    })

    const map: Record<string, number> = {}

    list.forEach((item) => {
      if (!item.created_at) return
      const day = item.created_at.toISOString().slice(0, 10)
      map[day] = (map[day] || 0) + (item._count as { id: number }).id
    })

    return {
      dates: Object.keys(map).sort(),
      values: Object.keys(map)
        .sort()
        .map((day) => map[day]),
    }
  }

  //设备分布
  private async visitorDevice({ startTime, endTime }: StatsParams) {
    const list = await prisma.track_Event.groupBy({
      by: ['ua'],
      where: {
        created_at: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

    //简单的设备类型识别
    const deviceMap: Record<string, number> = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0,
    }

    list.forEach((item) => {
      if (!item.ua) {
        deviceMap.other += (item._count as { id: number }).id
        return
      }

      const ua = item.ua.toLowerCase()
      if (
        ua.includes('mobile') ||
        ua.includes('android') ||
        ua.includes('iphone') ||
        ua.includes('ipad')
      ) {
        deviceMap.mobile += (item._count as { id: number }).id
      } else if (ua.includes('tablet')) {
        deviceMap.tablet += (item._count as { id: number }).id
      } else {
        deviceMap.desktop += (item._count as { id: number }).id
      }
    })

    return Object.entries(deviceMap).map(([name, count]) => ({
      name,
      count,
    }))
  }

  //事件分析
  private async behaviorEvents({ startTime, endTime }: StatsParams) {
    const list = await prisma.behavior.groupBy({
      by: ['event'],
      where: {
        timestamp: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

    return list.map((item) => ({
      name: item.event || 'Unknown',
      count: (item._count as { id: number }).id,
    }))
  }

  //页面访问
  private async behaviorPageViews({ startTime, endTime }: StatsParams) {
    const list = await prisma.behavior.groupBy({
      by: ['pageUrl'],
      where: {
        timestamp: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

    return list.map((item) => ({
      name: item.pageUrl || 'Unknown',
      count: item._count.id,
    }))
  }

  //错误趋势
  private async errorTrends({ startTime, endTime }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近24小时
    const defaultStartTime = new Date()
    defaultStartTime.setHours(defaultStartTime.getHours() - 24)

    const list = await prisma.error.groupBy({
      by: ['timestamp', 'errorType'],
      where: {
        timestamp: {
          gte: startTime ? new Date(startTime) : defaultStartTime,
          lte: endTime ? new Date(endTime) : new Date(),
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    const dates = new Set<string>()
    const errorTypes = new Set<string>()
    const dataMap: Record<string, Record<string, number>> = {}

    list.forEach((item) => {
      if (!item.timestamp || !item.errorType) return
      const dayHour = item.timestamp.toISOString().slice(0, 13)
      const errorType = item.errorType

      dates.add(dayHour)
      errorTypes.add(errorType)

      if (!dataMap[dayHour]) {
        dataMap[dayHour] = {}
      }

      dataMap[dayHour][errorType] =
        (dataMap[dayHour][errorType] || 0) + (item._count as { id: number }).id
    })

    const sortedDates = Array.from(dates).sort()
    const uniqueErrorTypes = Array.from(errorTypes)

    // 错误类型映射
    const errorTypeMap: Record<string, string> = {
      js: 'JS错误',
      api: 'API错误',
      cors: '跨域错误',
      framework: '框架错误',
      页面崩溃: '页面崩溃',
    }

    const colors = ['#cf1322', '#1890ff', '#52c41a', '#faad14', '#722ed1']

    const series = uniqueErrorTypes.map((errorType, index) => {
      let displayName = errorType
      if (errorTypeMap[errorType]) {
        displayName = errorTypeMap[errorType]
      }
      return {
        name: displayName,
        type: 'line',
        smooth: true,
        data: sortedDates.map((day) => {
          return dataMap[day]?.[errorType] || 0
        }),
        itemStyle: { color: colors[index % colors.length] },
      }
    })

    return {
      dates: sortedDates,
      series,
    }
  }

  //白屏趋势
  private async whiteScreenTrends({ startTime, endTime }: StatsParams) {
    const list = await prisma.blank_Screen.groupBy({
      by: ['timestamp'],
      where: {
        isBlank: true,
        timestamp: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    const map: Record<string, number> = {}

    list.forEach((item) => {
      if (!item.timestamp) return
      const day = item.timestamp.toISOString().slice(0, 10)
      map[day] = (map[day] || 0) + (item._count as { id: number }).id
    })

    return {
      dates: Object.keys(map).sort(),
      values: Object.keys(map)
        .sort()
        .map((day) => map[day]),
    }
  }

  //白屏TOP页面
  private async whiteScreenTopPages({ startTime, endTime }: StatsParams) {
    const list = await prisma.blank_Screen.groupBy({
      by: ['pageUrl'],
      where: {
        isBlank: true,
        timestamp: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    return list.map((item) => ({
      name: item.pageUrl || 'Unknown',
      count: (item._count as { id: number }).id,
    }))
  }

  //高频报错页面
  private async highErrorPages({ startTime, endTime }: StatsParams) {
    const list = await prisma.error.groupBy({
      by: ['pageUrl'],
      where: {
        timestamp: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    return list.map((item) => ({
      name: item.pageUrl || 'Unknown',
      count: item._count.id,
    }))
  }

  //错误列表
  private async errorList({ startTime, endTime, page = 1, pageSize = 20 }: StatsParams) {
    const skip = (page - 1) * pageSize
    const take = pageSize

    const [total, list] = await Promise.all([
      prisma.error.count({
        where: {
          timestamp: {
            gte: startTime ? new Date(startTime) : undefined,
            lte: endTime ? new Date(endTime) : undefined,
          },
        },
      }),
      prisma.error.findMany({
        where: {
          timestamp: {
            gte: startTime ? new Date(startTime) : undefined,
            lte: endTime ? new Date(endTime) : undefined,
          },
        },
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
    ])

    return {
      total,
      list,
      page,
      pageSize,
    }
  }

  //按错误类型查询
  private async errorByType({ page = 1, pageSize = 20 }: StatsParams, errorType: string) {
    const skip = (page - 1) * pageSize
    const take = pageSize

    // 直接查询所有错误，不限制时间范围
    const [total, list] = await Promise.all([
      prisma.error.count({
        where: {
          errorType,
        },
      }),
      prisma.error.findMany({
        where: {
          errorType,
        },
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
    ])

    return {
      total,
      list,
      page,
      pageSize,
    }
  }
}

export default new StatsService()
