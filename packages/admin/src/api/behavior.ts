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
  baseURL: API_BASE_URL, // 使用配置的API基础URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
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
      localStorage.removeItem('authToken')
      // 检查当前页面是否已经是登录页面，避免登录失败时页面刷新
      // 登录页面的实际路径是 / 而不是 /login
      if (window.location.pathname !== '/') {
        window.location.href = '/' // 重定向到登录页面
      }
    }
    return Promise.reject(error)
  }
)

// 行为分析相关 API
export const behaviorAPI = {
  // 获取页面访问数据
  getPageVisits: async (): Promise<ApiResponse<PageVisitData[]>> => {
    try {
      const response = await api.get('/api/stats', {
        params: {
          type: 'behavior_page_views',
        },
      })

      const data = response.data.data

      // 转换数据格式
      const pageVisits: PageVisitData[] = data.map((item: any) => ({
        pageUrl: item.name,
        pageViews: item.count,
        uniqueVisitors: item.count, // 简化处理
        bounceRate: '0%', // 暂不支持
        averageStayTime: '0:00', // 暂不支持
        exitRate: '0%', // 暂不支持
      }))

      return {
        code: 200,
        message: 'success',
        data: pageVisits,
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
      const page = filterParams.page || 1
      const pageSize = filterParams.pageSize || 10

      // 调用后端的stats接口获取事件数据
      const response = await api.get('/api/stats', {
        params: {
          type: 'behavior_events',
        },
      })

      const eventData = response.data.data || []

      // 转换数据格式
      const userBehaviors: UserBehaviorData[] = eventData.map((item: any, index: number) => ({
        id: `event-${index + 1}`,
        timestamp: new Date().toISOString(),
        userType: 'guest',
        behaviorType: item.name as EventType,
        pageUrl: 'https://example.com',
        duration: 0,
        device: 'desktop',
        browser: 'Unknown',
        referrer: '',
        sessionId: 'session-' + Math.floor(Math.random() * 1000000),
        eventDetails: { count: item.count },
      }))

      // 模拟分页
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = userBehaviors.slice(startIndex, endIndex)

      return {
        code: 200,
        message: 'success',
        data: {
          data: paginatedData,
          total: userBehaviors.length,
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
      // 暂时返回空数据，需要后端实现对应的接口
      return {
        code: 200,
        message: 'success',
        data: [],
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
      const response = await api.get('/api/stats', {
        params: {
          type: 'behavior_events',
        },
      })

      const eventData = response.data.data

      // 计算统计数据
      const totalEvents = eventData.reduce((sum: number, item: any) => sum + item.count, 0)
      const totalUniqueVisitors = totalEvents // 简化处理
      const avgEventPerVisitor = totalUniqueVisitors > 0 ? totalEvents / totalUniqueVisitors : 0

      // 找出最活跃的页面（暂时使用事件数最多的事件类型）
      let mostActivePage = ''
      if (eventData.length > 0) {
        mostActivePage = eventData[0].name
      }

      // 获取前5个事件类型
      const topEventTypes = eventData.slice(0, 5).map((item: any) => ({
        type: item.name as EventType,
        count: item.count,
      }))

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
      const response = await api.get('/api/stats', {
        params: {
          type: 'behavior_events',
        },
      })

      const eventData = response.data.data
      const totalEvents = eventData.reduce((sum: number, item: any) => sum + item.count, 0)

      // 计算分布百分比
      const distribution: EventTypeDistributionData[] = eventData.map((item: any) => ({
        type: item.name as EventType,
        count: item.count,
        percentage: totalEvents > 0 ? (item.count / totalEvents) * 100 : 0,
      }))

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
      // 暂时返回空数据，需要后端实现对应的接口
      return {
        code: 200,
        message: 'success',
        data: [],
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
