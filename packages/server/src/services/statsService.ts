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
}

export default new StatsService()
