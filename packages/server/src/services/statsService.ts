import prisma from '../lib/prisma'

interface StatsParams {
  type: string
  startTime?: number
  endTime?: number
  limit?: number
  page?: number
  pageSize?: number
  userId?: string
  projectIds?: string[]
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

      case 'customerSource':
        return this.customerSource(params)

      case 'customerGrowth':
        return this.customerGrowth(params)

      default:
        throw new Error(`未知统计类型: ${type}`)
    }
  }
  //性能均值
  private async performanceAvg({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    } else {
      // 当没有项目 ID 时，返回空数据
      return {
        dates: [],
        loadTimeAvg: [],
        firstPaintAvg: [],
        domReadyAvg: [],
        ttfbAvg: [],
        dnsAvg: [],
        tcpAvg: [],
        longTaskAvg: [],
        fpsAvg: [],
        resourceLoadAvg: [],
        lcpAvg: [],
        inpAvg: [],
        fcpAvg: [],
        dclAvg: [],
      }
    }

    try {
      const list = await prisma.performance.findMany({
        where,
        select: {
          timestamp: true,
          loadTime: true,
          domReady: true,
          firstPaint: true,
          extra: true,
        },
      })

      const map: Record<
        string,
        {
          load: number[]
          paint: number[]
          domReady: number[]
          ttfb: number[]
          dns: number[]
          tcp: number[]
          longTask: number[]
          fps: number[]
          resourceLoad: number[]
          lcp: number[]
          inp: number[]
          fcp: number[]
          dcl: number[]
        }
      > = {}

      list.forEach((item) => {
        // 优先使用 extra 字段中的 timestamp
        let timestamp = item.timestamp
        if (item.extra && typeof item.extra === 'string') {
          try {
            const extraData = JSON.parse(item.extra)
            if (extraData.timestamp) {
              timestamp = new Date(extraData.timestamp)
            }
          } catch (error) {
            console.error('解析 extra 字段失败:', error)
          }
        }

        if (!timestamp) return

        // 使用更细粒度的时间分组，保留到秒
        const timeKey = timestamp.toISOString().slice(0, 19)

        if (!map[timeKey])
          map[timeKey] = {
            load: [],
            paint: [],
            domReady: [],
            ttfb: [],
            dns: [],
            tcp: [],
            longTask: [],
            fps: [],
            resourceLoad: [],
            lcp: [],
            inp: [],
            fcp: [],
            dcl: [],
          }

        if (item.loadTime) {
          map[timeKey].load.push(item.loadTime)
          // 为 LCP 提供默认值，假设 loadTime 为 LCP
          map[timeKey].lcp.push(item.loadTime)
        }
        if (item.firstPaint) {
          map[timeKey].paint.push(item.firstPaint)
          map[timeKey].fcp.push(item.firstPaint) // 假设 firstPaint 为 FCP
          // 为 INP 提供默认值，假设 firstPaint 为 INP
          map[timeKey].inp.push(item.firstPaint)
        }
        if (item.domReady) {
          map[timeKey].domReady.push(item.domReady)
          map[timeKey].dcl.push(item.domReady) // 假设 domReady 为 DCL
        }

        // 从 extra 字段中解析更多性能指标
        if (item.extra && typeof item.extra === 'string') {
          try {
            const extraData = JSON.parse(item.extra)

            // 从 performanceData 中提取指标
            if (extraData.performanceData) {
              const {
                loadingPerformance,
                networkPerformance,
                runtimePerformance,
                coreVitals,
                coreWebVitals,
              } = extraData.performanceData

              if (loadingPerformance?.ttfb) map[timeKey].ttfb.push(loadingPerformance.ttfb)
              if (networkPerformance?.dns) map[timeKey].dns.push(networkPerformance.dns)
              if (networkPerformance?.tcp) map[timeKey].tcp.push(networkPerformance.tcp)
              if (runtimePerformance?.longTask)
                map[timeKey].longTask.push(runtimePerformance.longTask)
              if (runtimePerformance?.fps) map[timeKey].fps.push(runtimePerformance.fps)
              if (runtimePerformance?.resourceLoad)
                map[timeKey].resourceLoad.push(runtimePerformance.resourceLoad)

              // 核心 Web Vitals 指标 - 兼容 coreVitals 和 coreWebVitals 两种格式
              if (coreVitals?.lcp || coreWebVitals?.lcp)
                map[timeKey].lcp.push(coreVitals?.lcp || coreWebVitals?.lcp)
              if (coreVitals?.inp || coreWebVitals?.inp)
                map[timeKey].inp.push(coreVitals?.inp || coreWebVitals?.inp)
              if (coreVitals?.fcp || coreWebVitals?.fcp)
                map[timeKey].fcp.push(coreVitals?.fcp || coreWebVitals?.fcp)
              if (coreVitals?.dcl || coreWebVitals?.dcl)
                map[timeKey].dcl.push(coreVitals?.dcl || coreWebVitals?.dcl)
            }

            // 直接从 extraData 中提取核心指标（兼容旧格式）
            if (extraData.lcp) map[timeKey].lcp.push(extraData.lcp)
            if (extraData.inp) map[timeKey].inp.push(extraData.inp)
            if (extraData.fcp) map[timeKey].fcp.push(extraData.fcp)
            if (extraData.dcl) map[timeKey].dcl.push(extraData.dcl)
          } catch (error) {
            console.error('解析 extra 字段失败:', error)
          }
        }
      })

      const dates: string[] = []
      const loadTimeAvg: number[] = []
      const firstPaintAvg: number[] = []
      const domReadyAvg: number[] = []
      const ttfbAvg: number[] = []
      const dnsAvg: number[] = []
      const tcpAvg: number[] = []
      const longTaskAvg: number[] = []
      const fpsAvg: number[] = []
      const resourceLoadAvg: number[] = []
      const lcpAvg: number[] = []
      const inpAvg: number[] = []
      const fcpAvg: number[] = []
      const dclAvg: number[] = []

      Object.keys(map)
        .sort()
        .forEach((timeKey) => {
          dates.push(timeKey)
          loadTimeAvg.push(
            Math.round(
              map[timeKey].load.reduce((a, b) => a + b, 0) / (map[timeKey].load.length || 1)
            )
          )
          firstPaintAvg.push(
            Math.round(
              map[timeKey].paint.reduce((a, b) => a + b, 0) / (map[timeKey].paint.length || 1)
            )
          )
          domReadyAvg.push(
            Math.round(
              map[timeKey].domReady.reduce((a, b) => a + b, 0) / (map[timeKey].domReady.length || 1)
            )
          )
          ttfbAvg.push(
            Math.round(
              map[timeKey].ttfb.reduce((a, b) => a + b, 0) / (map[timeKey].ttfb.length || 1)
            )
          )
          dnsAvg.push(
            Math.round(map[timeKey].dns.reduce((a, b) => a + b, 0) / (map[timeKey].dns.length || 1))
          )
          tcpAvg.push(
            Math.round(map[timeKey].tcp.reduce((a, b) => a + b, 0) / (map[timeKey].tcp.length || 1))
          )
          longTaskAvg.push(
            Math.round(
              map[timeKey].longTask.reduce((a, b) => a + b, 0) / (map[timeKey].longTask.length || 1)
            )
          )
          fpsAvg.push(
            Math.round(map[timeKey].fps.reduce((a, b) => a + b, 0) / (map[timeKey].fps.length || 1))
          )
          resourceLoadAvg.push(
            Math.round(
              map[timeKey].resourceLoad.reduce((a, b) => a + b, 0) /
                (map[timeKey].resourceLoad.length || 1)
            )
          )
          lcpAvg.push(
            Math.round(map[timeKey].lcp.reduce((a, b) => a + b, 0) / (map[timeKey].lcp.length || 1))
          )
          inpAvg.push(
            Math.round(map[timeKey].inp.reduce((a, b) => a + b, 0) / (map[timeKey].inp.length || 1))
          )
          fcpAvg.push(
            Math.round(map[timeKey].fcp.reduce((a, b) => a + b, 0) / (map[timeKey].fcp.length || 1))
          )
          dclAvg.push(
            Math.round(map[timeKey].dcl.reduce((a, b) => a + b, 0) / (map[timeKey].dcl.length || 1))
          )
        })

      return {
        dates,
        loadTimeAvg,
        firstPaintAvg,
        domReadyAvg,
        ttfbAvg,
        dnsAvg,
        tcpAvg,
        longTaskAvg,
        fpsAvg,
        resourceLoadAvg,
        lcpAvg,
        inpAvg,
        fcpAvg,
        dclAvg,
      }
    } catch (error) {
      console.error('获取性能均值数据失败:', error)
      // 出错时返回空数据
      return {
        dates: [],
        loadTimeAvg: [],
        firstPaintAvg: [],
        domReadyAvg: [],
        ttfbAvg: [],
        dnsAvg: [],
        tcpAvg: [],
        longTaskAvg: [],
        fpsAvg: [],
        resourceLoadAvg: [],
        lcpAvg: [],
        inpAvg: [],
        fcpAvg: [],
        dclAvg: [],
      }
    }
  }

  //错误 Top N
  private async errorTopN({ startTime, endTime, projectIds }: StatsParams, limit: number) {
    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤（无项目时查全部数据）
    if (projectIds && projectIds.length > 0) {
      where.project_id = { in: projectIds }
    }

    try {
      const list = await prisma.error.groupBy({
        by: ['errorType'],
        where,
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
    } catch (error) {
      console.error('获取错误 Top N 数据失败:', error)
      // 出错时返回空数组
      return []
    }
  }

  //白屏率
  private async blankRate({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近30天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 30)

    // 将时间转换为日期（去掉时间部分），因为数据库字段是 @db.Date
    const startDate = startTime ? new Date(startTime) : defaultStartTime
    startDate.setHours(0, 0, 0, 0)
    const endDate = endTime ? new Date(endTime) : new Date()
    endDate.setHours(23, 59, 59, 999)

    const timeRange = {
      gte: startDate,
      lte: endDate,
    }

    const whereBlank: any = {
      isBlank: 'true',
      timestamp: timeRange,
    }

    const whereTrack: any = {
      created_at: timeRange,
    }

    // 添加项目 ID 过滤（无项目时查全部数据）
    if (projectIds && projectIds.length > 0) {
      whereBlank.project_id = { in: projectIds }
      whereTrack.project_id = { in: projectIds }
    }

    try {
      const [blankCount, pv] = await Promise.all([
        prisma.blank_Screen.count({
          where: whereBlank,
        }),
        prisma.track_Event.count({
          where: whereTrack,
        }),
      ])

      return {
        blankCount,
        pv,
        blankRate: pv === 0 ? 0 : Number((blankCount / pv).toFixed(4)),
      }
    } catch (error) {
      console.error('获取白屏率数据失败:', error)
      // 出错时返回空数据
      return {
        blankCount: 0,
        pv: 0,
        blankRate: 0,
      }
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
  private async visitorTrends({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近30天（因为 @db.Date 只存日期，放宽范围）
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 30)

    // 将时间转换为日期（去掉时间部分），因为数据库字段是 @db.Date
    const startDate = startTime ? new Date(startTime) : defaultStartTime
    startDate.setHours(0, 0, 0, 0)
    const endDate = endTime ? new Date(endTime) : new Date()
    endDate.setHours(23, 59, 59, 999)

    const where: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    }

    // 添加项目 ID 过滤（无项目时查全部数据，保证有数据时能展示）
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    }

    try {
      const list = await prisma.track_Event.groupBy({
        by: ['created_at'],
        where,
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

      let dates = Object.keys(map).sort()
      let values = dates.map((day) => map[day])

      // 若 Track_Event 无数据，用 Behavior 表按日期聚合作为回退（与客户增长同源）
      if (dates.length === 0) {
        const behaviorWhere: any = {
          timestamp: { gte: startDate, lte: endDate },
        }
        if (projectIds && projectIds.length > 0) {
          behaviorWhere.project_id = { in: projectIds }
        }
        const behaviors = await prisma.behavior.findMany({
          where: behaviorWhere,
          select: { timestamp: true },
        })
        const behaviorMap: Record<string, number> = {}
        behaviors.forEach((item) => {
          if (item.timestamp) {
            const day = item.timestamp.toISOString().slice(0, 10)
            behaviorMap[day] = (behaviorMap[day] || 0) + 1
          }
        })
        dates = Object.keys(behaviorMap).sort()
        values = dates.map((day) => behaviorMap[day])
      }

      return {
        dates,
        values,
      }
    } catch (error) {
      console.error('获取访客趋势数据失败:', error)
      return { dates: [], values: [] }
    }
  }

  //设备分布
  private async visitorDevice({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近30天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 30)

    // 将时间转换为日期（去掉时间部分），因为数据库字段是 @db.Date
    const startDate = startTime ? new Date(startTime) : defaultStartTime
    startDate.setHours(0, 0, 0, 0)
    const endDate = endTime ? new Date(endTime) : new Date()
    endDate.setHours(23, 59, 59, 999)

    const where: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    }

    // 添加项目 ID 过滤（无项目时查全部数据）
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    }

    try {
      const list = await prisma.track_Event.groupBy({
        by: ['ua'],
        where,
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

      const total = Object.values(deviceMap).reduce((a, b) => a + b, 0)
      // 若 Track_Event 无数据，用 Behavior 表按 userAgent 聚合作为回退
      if (total === 0) {
        const behaviorWhere: any = {
          timestamp: { gte: startDate, lte: endDate },
        }
        if (projectIds && projectIds.length > 0) {
          behaviorWhere.project_id = { in: projectIds }
        }
        const behaviors = await prisma.behavior.findMany({
          where: behaviorWhere,
          select: { userAgent: true },
        })
        behaviors.forEach((item) => {
          const ua = (item.userAgent || '').toLowerCase()
          if (!ua) {
            deviceMap.other += 1
          } else if (
            ua.includes('mobile') ||
            ua.includes('android') ||
            ua.includes('iphone') ||
            ua.includes('ipad')
          ) {
            deviceMap.mobile += 1
          } else if (ua.includes('tablet')) {
            deviceMap.tablet += 1
          } else {
            deviceMap.desktop += 1
          }
        })
      }

      return Object.entries(deviceMap).map(([name, count]) => ({
        name,
        count,
      }))
    } catch (error) {
      console.error('获取设备分布数据失败:', error)
      return []
    }
  }

  //事件分析
  private async behaviorEvents({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    }

    const list = await prisma.behavior.groupBy({
      by: ['event'],
      where,
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
  private async behaviorPageViews({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    }

    const list = await prisma.behavior.groupBy({
      by: ['pageUrl'],
      where,
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
  private async errorTrends({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    }

    const list = await prisma.error.groupBy({
      by: ['timestamp', 'errorType'],
      where,
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
      const count = Number((item._count as { id?: number })?.id ?? 0)
      if (count <= 0) return

      dates.add(dayHour)
      errorTypes.add(errorType)

      if (!dataMap[dayHour]) {
        dataMap[dayHour] = {}
      }

      dataMap[dayHour][errorType] = (dataMap[dayHour][errorType] || 0) + count
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

  //白屏趋势（findMany 全量取再按日期聚合，避免 @db.Date 与 Date 比较的时区/类型问题）
  private async whiteScreenTrends({ startTime, endTime }: StatsParams) {
    const defaultStart = new Date()
    defaultStart.setDate(defaultStart.getDate() - 30)
    defaultStart.setHours(0, 0, 0, 0)
    const defaultEnd = new Date()
    defaultEnd.setHours(23, 59, 59, 999)
    const startMs = startTime ?? defaultStart.getTime()
    const endMs = endTime ?? defaultEnd.getTime()
    const startDay = new Date(startMs).toISOString().slice(0, 10)
    const endDay = new Date(endMs).toISOString().slice(0, 10)

    try {
      const rows = await prisma.blank_Screen.findMany({
        select: { timestamp: true },
      })

      const map: Record<string, number> = {}
      for (const row of rows) {
        if (row.timestamp == null) continue
        const day =
          row.timestamp instanceof Date
            ? row.timestamp.toISOString().slice(0, 10)
            : String(row.timestamp).slice(0, 10)
        if (day.length < 10) continue
        if (day < startDay || day > endDay) continue
        map[day] = (map[day] || 0) + 1
      }

      const dates = Object.keys(map).sort()
      return {
        dates,
        values: dates.map((day) => map[day]),
      }
    } catch (error) {
      console.error('获取白屏趋势数据失败:', error)
      return { dates: [], values: [] }
    }
  }

  //白屏TOP页面
  private async whiteScreenTopPages({ startTime, endTime }: StatsParams) {
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 30)

    const startDate = startTime ? new Date(startTime) : defaultStartTime
    startDate.setHours(0, 0, 0, 0)
    const endDate = endTime ? new Date(endTime) : new Date()
    endDate.setHours(23, 59, 59, 999)

    const where: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    }

    const list = await prisma.blank_Screen.groupBy({
      by: ['pageUrl'],
      where,
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
  private async highErrorPages({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    }

    const list = await prisma.error.groupBy({
      by: ['pageUrl'],
      where,
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
  private async errorList({
    startTime,
    endTime,
    page = 1,
    pageSize = 20,
    projectIds,
  }: StatsParams) {
    const skip = (page - 1) * pageSize
    const take = pageSize

    // 如果没有提供时间范围，默认查询最近30天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 30)

    // 将时间转换为日期（去掉时间部分），因为数据库字段是 @db.Date
    const startDate = startTime ? new Date(startTime) : defaultStartTime
    startDate.setHours(0, 0, 0, 0)
    const endDate = endTime ? new Date(endTime) : new Date()
    endDate.setHours(23, 59, 59, 999)

    const where: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    }

    // 添加项目 ID 过滤
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    }

    const [total, list] = await Promise.all([
      prisma.error.count({
        where,
      }),
      prisma.error.findMany({
        where,
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
  private async errorByType(
    { page = 1, pageSize = 20, startTime, endTime, projectIds }: StatsParams,
    errorType: string
  ) {
    const skip = (page - 1) * pageSize
    const take = pageSize

    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      errorType,
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤
    if (projectIds && projectIds.length > 0) {
      where.project_id = {
        in: projectIds,
      }
    }

    const [total, list] = await Promise.all([
      prisma.error.count({
        where,
      }),
      prisma.error.findMany({
        where,
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

  //客户来源分析
  private async customerSource({ limit = 10, startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤（无项目时查全部数据）
    if (projectIds && projectIds.length > 0) {
      where.project_id = { in: projectIds }
    }

    try {
      const behaviors = await prisma.behavior.findMany({
        where,
        select: {
          extra: true,
          pageUrl: true,
        },
        take: 1000,
      })

      // 按来源类型分组统计
      const sourceMap = new Map<string, number>()
      behaviors.forEach((item) => {
        let source = '其他来源'

        // 优先从 extra 字段解析
        if (typeof item.extra === 'string') {
          try {
            const extra = JSON.parse(item.extra)
            if (extra.source) {
              source = extra.source.toString()
            } else if (extra.referrer) {
              // 如果没有 source，尝试用 referrer
              source = extra.referrer.toString()
            } else if (item.pageUrl) {
              // 如果都没有，用 pageUrl 的域名作为来源
              try {
                const url = new URL(item.pageUrl)
                source = url.hostname
              } catch {
                source = '直接访问'
              }
            }
          } catch (error) {
            // 解析失败时使用默认值
          }
        } else if (item.pageUrl) {
          // 如果没有 extra，尝试从 pageUrl 提取
          try {
            const url = new URL(item.pageUrl)
            source = url.hostname
          } catch {
            source = '直接访问'
          }
        }

        const currentCount = sourceMap.get(source) || 0
        sourceMap.set(source, currentCount + 1)
      })

      // 转换为数组并计算占比
      const total = Array.from(sourceMap.values()).reduce((sum, count) => sum + count, 0)
      const sourceData = Array.from(sourceMap.entries())
        .map(([name, count]) => ({
          name: name || '其他来源',
          value: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)

      return sourceData
    } catch (error) {
      console.error('获取客户来源数据失败:', error)
      // 出错时返回空数组
      return []
    }
  }

  //客户增长趋势
  private async customerGrowth({ startTime, endTime, projectIds }: StatsParams) {
    // 如果没有提供时间范围，默认查询最近7天
    const defaultStartTime = new Date()
    defaultStartTime.setDate(defaultStartTime.getDate() - 7)

    const where: any = {
      timestamp: {
        gte: startTime ? new Date(startTime) : defaultStartTime,
        lte: endTime ? new Date(endTime) : new Date(),
      },
    }

    // 添加项目 ID 过滤（无项目时查全部数据）
    if (projectIds && projectIds.length > 0) {
      where.project_id = { in: projectIds }
    }

    try {
      const behaviors = await prisma.behavior.findMany({
        where,
        select: {
          timestamp: true,
        },
      })

      // 按日期分组统计
      const dateMap = new Map<string, number>()
      behaviors.forEach((item) => {
        if (item.timestamp) {
          const date = item.timestamp.toISOString().split('T')[0]
          const currentCount = dateMap.get(date) || 0
          dateMap.set(date, currentCount + 1)
        }
      })

      // 处理数据格式，计算新增用户、活跃用户和累计用户
      let totalUsers = 0
      const growthData = Array.from(dateMap.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([dateStr]) => {
          const newUsers = dateMap.get(dateStr) || 0
          const activeUsers = newUsers // 简化处理，使用新增用户数作为活跃用户数
          totalUsers += newUsers

          return {
            timestamp: new Date(dateStr),
            newUsers,
            activeUsers,
            totalUsers,
          }
        })

      return growthData
    } catch (error) {
      console.error('获取客户增长趋势数据失败:', error)
      // 出错时返回空数据
      return []
    }
  }
}

export default new StatsService()
