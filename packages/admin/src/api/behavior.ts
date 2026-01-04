import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS, ApiResponse } from './config'
import dayjs from 'dayjs'

// 定义事件类型枚举
export enum EventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  SCROLL = 'scroll',
  SEARCH = 'search',
  FORM_SUBMIT = 'form_submit',
  LINK_CLICK = 'link_click',
  VIDEO_PLAY = 'video_play',
  VIDEO_PAUSE = 'video_pause',
}

// 定义用户类型枚举
export enum UserType {
  GUEST = 'guest',
  REGISTERED = 'registered',
}

// 定义设备类型枚举
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

// 定义页面访问数据类型
export interface PageVisitData {
  pageUrl: string
  pageViews: number
  uniqueVisitors: number
  bounceRate: string
  averageStayTime: string
  exitRate: string
}

// 定义用户行为数据类型
export interface UserBehaviorData {
  id: string
  timestamp: string
  userType: UserType
  behaviorType: EventType
  pageUrl: string
  duration: number
  device: DeviceType
  browser: string
  referrer: string
  userId?: string
  sessionId: string
  eventDetails?: Record<string, any>
}

// 定义行为趋势数据类型
export interface BehaviorTrendData {
  date: string
  pageViews: number
  uniqueVisitors: number
  avgDuration: number
  bounceRate: number
}

// 定义事件统计数据类型
export interface EventStatsData {
  totalEvents: number
  totalUniqueVisitors: number
  avgEventPerVisitor: number
  mostActivePage: string
  topEventTypes: { type: EventType; count: number }[]
}

// 定义事件类型分布数据
export interface EventTypeDistributionData {
  type: EventType
  count: number
  percentage: number
}

// 定义设备分布数据
export interface DeviceDistributionData {
  type: DeviceType
  count: number
  percentage: number
}

// 定义事件筛选参数
export interface EventFilterParams {
  startDate?: string
  endDate?: string
  eventType?: EventType
  userType?: UserType
  deviceType?: DeviceType
  pageUrl?: string
  browser?: string
  sessionId?: string
  userId?: string
  searchKeyword?: string
  page?: number
  pageSize?: number
}

// 创建 axios 实例
const api = axios.create({
  baseURL: '', // 空字符串，使用Vite代理
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // 检查当前页面是否已经是登录页面，避免登录失败时页面刷新
      // 登录页面的实际路径是 / 而不是 /login
      if (window.location.pathname !== '/') {
        window.location.href = '/' // 重定向到登录页面
      }
    }
    return Promise.reject(error)
  }
)

// 从 localStorage 获取行为数据
const getBehaviorsFromLocalStorage = (): any[] => {
  try {
    const behaviors = localStorage.getItem('behaviors')
    return behaviors ? JSON.parse(behaviors) : []
  } catch (error) {
    console.error('从 localStorage 获取行为数据失败:', error)
    return []
  }
}

// 行为分析相关 API
export const behaviorAPI = {
  // 获取页面访问数据
  getPageVisits: async (): Promise<ApiResponse<PageVisitData[]>> => {
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 按页面URL分组计算访问数据
      const pageDataMap: Record<string, PageVisitData> = {}

      behaviors.forEach((behavior: any) => {
        const pageUrl = behavior.page || window.location.origin

        if (!pageDataMap[pageUrl]) {
          pageDataMap[pageUrl] = {
            pageUrl,
            pageViews: 0,
            uniqueVisitors: 0,
            bounceRate: '0%',
            averageStayTime: '0:00',
            exitRate: '0%',
          }
        }

        // 增加页面访问量
        pageDataMap[pageUrl].pageViews += 1

        // 简化处理，使用访问量作为唯一访客数
        pageDataMap[pageUrl].uniqueVisitors = pageDataMap[pageUrl].pageViews
      })

      const pageData = Object.values(pageDataMap)

      return {
        code: 200,
        message: 'success',
        data: pageData,
      }
    } catch (error) {
      console.error('获取页面访问数据失败:', error)
      return {
        code: 500,
        message: '获取页面访问数据失败',
        data: [],
      }
    }
  },

  // 获取用户行为数据
  getUserBehaviors: async (
    filterParams: EventFilterParams = {}
  ): Promise<
    ApiResponse<{
      data: UserBehaviorData[]
      total: number
      page: number
      pageSize: number
    }>
  > => {
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 分页处理
      const page = filterParams.page || 1
      const pageSize = filterParams.pageSize || 10
      const total = behaviors.length

      // 转换为UserBehaviorData格式
      const userBehaviors: UserBehaviorData[] = behaviors.map((behavior: any, index: number) => ({
        id: `event-${index + 1}`,
        timestamp: dayjs(behavior.timestamp).toISOString(),
        userType: UserType.GUEST,
        behaviorType: (behavior.type || 'page_view') as EventType,
        pageUrl: behavior.page || window.location.origin,
        duration: behavior.duration || 0,
        device: DeviceType.DESKTOP,
        browser: 'Unknown',
        referrer: '',
        sessionId: `session-${Math.floor(Math.random() * 1000)}`,
        eventDetails: behavior.data,
      }))

      // 分页
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = userBehaviors.slice(startIndex, endIndex)

      return {
        code: 200,
        message: 'success',
        data: {
          data: paginatedData,
          total,
          page,
          pageSize,
        },
      }
    } catch (error) {
      console.error('获取用户行为数据失败:', error)
      return {
        code: 500,
        message: '获取用户行为数据失败',
        data: {
          data: [],
          total: 0,
          page: 1,
          pageSize: 10,
        },
      }
    }
  },

  // 获取行为趋势数据
  getBehaviorTrends: async (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<BehaviorTrendData[]>> => {
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 按日期分组计算趋势数据
      const trendMap: Record<string, BehaviorTrendData> = {}
      const start = dayjs(startDate)
      const end = dayjs(endDate)
      const days = end.diff(start, 'day') + 1

      // 初始化日期范围
      for (let i = 0; i < days; i++) {
        const date = start.add(i, 'day').format('YYYY-MM-DD')
        trendMap[date] = {
          date,
          pageViews: 0,
          uniqueVisitors: 0,
          avgDuration: 0,
          bounceRate: 0,
        }
      }

      // 统计每天的行为数据
      behaviors.forEach((behavior: any) => {
        const behaviorDate = dayjs(behavior.timestamp).format('YYYY-MM-DD')

        if (trendMap[behaviorDate]) {
          // 增加页面访问量
          trendMap[behaviorDate].pageViews += 1

          // 简化处理，使用访问量作为唯一访客数
          trendMap[behaviorDate].uniqueVisitors = trendMap[behaviorDate].pageViews
        }
      })

      const trendData = Object.values(trendMap)

      return {
        code: 200,
        message: 'success',
        data: trendData,
      }
    } catch (error) {
      console.error('获取行为趋势数据失败:', error)
      return {
        code: 500,
        message: '获取行为趋势数据失败',
        data: [],
      }
    }
  },

  // 获取事件统计数据
  getEventStats: async (
    filterParams: EventFilterParams = {}
  ): Promise<ApiResponse<EventStatsData>> => {
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 统计事件类型
      const eventTypeCount: Record<string, number> = {}
      const pageCount: Record<string, number> = {}

      behaviors.forEach((behavior: any) => {
        // 统计事件类型
        const eventType = behavior.type || 'page_view'
        eventTypeCount[eventType] = (eventTypeCount[eventType] || 0) + 1

        // 统计页面访问
        const page = behavior.page || window.location.origin
        pageCount[page] = (pageCount[page] || 0) + 1
      })

      // 计算统计数据
      const totalEvents = behaviors.length
      const totalUniqueVisitors = behaviors.length // 简化处理
      const avgEventPerVisitor = totalUniqueVisitors > 0 ? totalEvents / totalUniqueVisitors : 0

      // 找出最活跃的页面
      let mostActivePage = window.location.origin
      let maxPageVisits = 0
      Object.entries(pageCount).forEach(([page, count]) => {
        if (count > maxPageVisits) {
          maxPageVisits = count
          mostActivePage = page
        }
      })

      // 获取前5个事件类型
      const topEventTypes = Object.entries(eventTypeCount)
        .map(([type, count]) => ({ type: type as EventType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const statsData: EventStatsData = {
        totalEvents,
        totalUniqueVisitors,
        avgEventPerVisitor,
        mostActivePage,
        topEventTypes,
      }

      return {
        code: 200,
        message: 'success',
        data: statsData,
      }
    } catch (error) {
      console.error('获取事件统计数据失败:', error)
      return {
        code: 500,
        message: '获取事件统计数据失败',
        data: {
          totalEvents: 0,
          totalUniqueVisitors: 0,
          avgEventPerVisitor: 0,
          mostActivePage: '',
          topEventTypes: [],
        },
      }
    }
  },

  // 获取事件类型分布
  getEventTypeDistribution: async (
    filterParams: EventFilterParams = {}
  ): Promise<ApiResponse<EventTypeDistributionData[]>> => {
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 统计事件类型
      const eventTypeCount: Record<string, number> = {}
      const totalEvents = behaviors.length

      behaviors.forEach((behavior: any) => {
        const eventType = behavior.type || 'page_view'
        eventTypeCount[eventType] = (eventTypeCount[eventType] || 0) + 1
      })

      // 计算分布百分比
      const distribution: EventTypeDistributionData[] = Object.entries(eventTypeCount)
        .map(([type, count]) => ({
          type: type as EventType,
          count,
          percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)

      return {
        code: 200,
        message: 'success',
        data: distribution,
      }
    } catch (error) {
      console.error('获取事件类型分布失败:', error)
      return {
        code: 500,
        message: '获取事件类型分布失败',
        data: [],
      }
    }
  },

  // 获取设备分布
  getDeviceDistribution: async (
    filterParams: EventFilterParams = {}
  ): Promise<ApiResponse<DeviceDistributionData[]>> => {
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 简化处理，只返回默认设备分布
      const distribution: DeviceDistributionData[] = [
        { type: DeviceType.DESKTOP, count: behaviors.length, percentage: 100 },
      ]

      return {
        code: 200,
        message: 'success',
        data: distribution,
      }
    } catch (error) {
      console.error('获取设备分布失败:', error)
      return {
        code: 500,
        message: '获取设备分布失败',
        data: [],
      }
    }
  },
}

export default api
