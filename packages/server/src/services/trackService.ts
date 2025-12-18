import { IErrorlog, IBehaviorLog, IPerformanceLog, IBlankScreenLog } from '../types'

class TrackService {
  //临时内存存储
  errorLogs: IErrorlog[] = []
  behaviorLogs: IBehaviorLog[] = []
  performanceLogs: IPerformanceLog[] = []
  blankLogs: IBlankScreenLog[] = []

  //分类处理
  handleReport(type: string, data: any) {
    data.time = data.time || Date.now()

    switch (type) {
      case 'error':
        this.errorLogs.push(data)
        break
      case 'behavior':
        this.behaviorLogs.push(data)
        break
      case 'performance':
        this.performanceLogs.push(data)
        break
      case 'blank':
        this.blankLogs.push(data)
        break
      default:
        console.warn('未知上报类型：', type)
    }
  }

  //批量处理
  handleBatch(reports: { type: string; data: any }[]) {
    for (const item of reports) {
      this.handleReport(item.type, item.data)
    }
  }

  queryLogs(params: {
    category: 'error' | 'behavior' | 'performance' | 'blank'
    startTime?: number
    endTime?: number
    keyword?: string // 搜索关键字
    page?: number // 页码（默认 1）
    pageSize?: number // 每页数量（默认 20）
  }) {
    const { category, startTime, endTime, keyword, page = 1, pageSize = 20 } = params

    let target: any[] = []

    // 根据分类确定数据源
    switch (category) {
      case 'error':
        target = this.errorLogs
        break
      case 'behavior':
        target = this.behaviorLogs
        break
      case 'performance':
        target = this.performanceLogs
        break
      case 'blank':
        target = this.blankLogs
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

    // result 用于承载过滤后的最终数据
    let result = target

    if (startTime) {
      result = result.filter((item) => item.time >= startTime)
    }

    if (endTime) {
      result = result.filter((item) => item.time <= endTime)
    }

    if (keyword) {
      result = result.filter((item) => JSON.stringify(item).includes(keyword))
    }

    const total = result.length
    const start = (page - 1) * pageSize
    const list = result.slice(start, start + pageSize)

    return {
      total,
      page,
      pageSize,
      list,
    }
  }
}

export default new TrackService()
