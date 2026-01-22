import prisma from '../lib/prisma'

interface StatsParams {
  type: string
  startTime?: number
  endTime?: number
  limit?: number
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
    const list = await prisma.error.groupBy({
      by: ['errorType'],
      where: {
        timestamp: {
          gte: startTime ? new Date(startTime) : undefined,
          lte: endTime ? new Date(endTime) : undefined,
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
      take: limit,
    })

    return list.map((item) => ({
      name: item.errorType || 'Unknown',
      count: item._count.errorType,
    }))
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
      map[day] = (map[day] || 0) + item._count.id
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
        deviceMap.other += item._count.id
        return
      }

      const ua = item.ua.toLowerCase()
      if (
        ua.includes('mobile') ||
        ua.includes('android') ||
        ua.includes('iphone') ||
        ua.includes('ipad')
      ) {
        deviceMap.mobile += item._count.id
      } else if (ua.includes('tablet')) {
        deviceMap.tablet += item._count.id
      } else {
        deviceMap.desktop += item._count.id
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
      count: item._count.id,
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
    const list = await prisma.error.groupBy({
      by: ['timestamp'],
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
        timestamp: 'asc',
      },
    })

    const map: Record<string, number> = {}

    list.forEach((item) => {
      if (!item.timestamp) return
      const day = item.timestamp.toISOString().slice(0, 10)
      map[day] = (map[day] || 0) + item._count.id
    })

    return {
      dates: Object.keys(map).sort(),
      values: Object.keys(map)
        .sort()
        .map((day) => map[day]),
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
      map[day] = (map[day] || 0) + item._count.id
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
      count: item._count.id,
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
}

export default new StatsService()
