import axios from 'axios'
import dayjs from 'dayjs'
import React from 'react'
import { API_BASE_URL, API_ENDPOINTS, ApiResponse } from './config'
import { data } from 'react-router-dom'

// 定义访客趋势数据类型
export interface VisitorDataPoint {
  date: string
  visitors: number
  pageViews: number
}

// 定义访客概览数据类型
export interface OverviewData {
  totalVisits: number
  uniqueVisitors: number
  averageDuration: number
  bounceRate: number
  pagesPerSession: number
  newVisitors: number
  returningVisitors: number
  maxActivity: number
  totalPageViews: number
  uniquePageViews: number
  totalSessions: number
  uniqueSessions: number
}

// 定义设备类型数据类型
export interface VisitorDeviceType {
  id: string
  name: string
  count: number
  icon: React.ReactNode
}

// 定义设备型号数据类型
export interface DeviceModel {
  id: string
  name: string
  count: number
  brand?: string
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

// 生成模拟的访客趋势数据
const generateMockVisitorData = (startDate: string, endDate: string): VisitorDataPoint[] => {
  const mockData: VisitorDataPoint[] = []
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  const days = end.diff(start, 'day') + 1

  // 生成有波动的模拟数据
  let baseVisitors = 100
  let basePageViews = 500

  for (let i = 0; i < days; i++) {
    const date = start.add(i, 'day').format('YYYY-MM-DD')
    // 生成有波动的随机数（±20%）
    const visitorsVariation = Math.random() * 40 - 20 // -20% 到 +20%
    const pageViewsVariation = Math.random() * 40 - 20 // -20% 到 +20%

    const visitors = Math.round(baseVisitors * (1 + visitorsVariation / 100))
    const pageViews = Math.round(basePageViews * (1 + pageViewsVariation / 100))

    // 每天基础值有小幅度变化
    baseVisitors = baseVisitors + Math.round(Math.random() * 10 - 5)
    basePageViews = basePageViews + Math.round(Math.random() * 50 - 25)

    mockData.push({
      date,
      visitors,
      pageViews,
    })
  }

  return mockData
}

// 生成模拟的访客概览数据
const generateMockOverviewData = (
  startDate: string,
  endDate: string,
  visitorData: VisitorDataPoint[]
): OverviewData => {
  // 计算总访客数和总浏览量
  const totalVisitors = visitorData.reduce((sum, item) => sum + item.visitors, 0)
  const totalPageViews = visitorData.reduce((sum, item) => sum + item.pageViews, 0)

  // 模拟其他数据
  return {
    totalVisits: totalVisitors,
    uniqueVisitors: Math.round(totalVisitors * 0.85), // 假设85%是独立访客
    averageDuration: 125, // 平均停留时间（秒）
    bounceRate: 45.2, // 跳出率（%）
    pagesPerSession: 3.2, // 每次会话平均浏览页数
    newVisitors: Math.round(totalVisitors * 0.6), // 假设60%是新访客
    returningVisitors: Math.round(totalVisitors * 0.4), // 假设40%是回访客
    maxActivity: Math.max(...visitorData.map((item) => item.visitors)), // 最大活跃度
    totalPageViews: totalPageViews,
    uniquePageViews: Math.round(totalPageViews * 0.7), // 假设70%是独立浏览量
    totalSessions: Math.round(totalVisitors * 1.2), // 总会话数
    uniqueSessions: Math.round(totalVisitors * 0.9), // 独立会话数
  }
}

// 生成模拟的设备统计数据

// 访客数据相关 API
export const visitorAPI = {
  // 获取访客趋势数据
  fetchVisitorTrends: async (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<VisitorDataPoint[]>> => {
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 将行为数据按日期分组
      const groupedByDate: Record<string, any[]> = {}
      behaviors.forEach((behavior: any) => {
        const date = dayjs(behavior.timestamp).format('YYYY-MM-DD')
        if (!groupedByDate[date]) {
          groupedByDate[date] = []
        }
        groupedByDate[date].push(behavior)
      })

      // 生成访客趋势数据
      const visitorData: VisitorDataPoint[] = []
      const start = dayjs(startDate)
      const end = dayjs(endDate)
      const days = end.diff(start, 'day') + 1

      for (let i = 0; i < days; i++) {
        const date = start.add(i, 'day').format('YYYY-MM-DD')
        const dayBehaviors = groupedByDate[date] || []

        // 简单计算：假设每个行为代表1个访客，每3个行为代表1个浏览量
        const visitors = dayBehaviors.length
        const pageViews = Math.ceil(dayBehaviors.length * 1.5)

        visitorData.push({
          date,
          visitors,
          pageViews,
        })
      }

      return {
        code: 200,
        message: 'success',
        data: visitorData,
      }
    } catch (error) {
      console.error('获取访客趋势数据失败:', error)
      return {
        code: 500,
        message: '获取访客趋势数据失败',
        data: [],
      }
    }
  },

  // 获取访客概览数据
  fetchVisitorOverview: async (
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<OverviewData>> => {
    try {
      // 先获取访客趋势数据
      const trendsResponse = await visitorAPI.fetchVisitorTrends(startDate, endDate)
      const visitorData = trendsResponse.data

      // 基于真实行为数据计算概览数据
      const totalVisitors = visitorData.reduce((sum, item) => sum + item.visitors, 0)
      const totalPageViews = visitorData.reduce((sum, item) => sum + item.pageViews, 0)

      // 根据真实数据计算概览统计
      const overviewData: OverviewData = {
        totalVisits: totalVisitors,
        uniqueVisitors: totalVisitors, // 简化处理，使用总访客数
        averageDuration: 0, // 没有实际数据，返回0
        bounceRate: 0, // 没有实际数据，返回0
        pagesPerSession: totalVisitors > 0 ? totalPageViews / totalVisitors : 0,
        newVisitors: 0, // 没有实际数据，返回0
        returningVisitors: 0, // 没有实际数据，返回0
        maxActivity: Math.max(...visitorData.map((item) => item.visitors), 0),
        totalPageViews: totalPageViews,
        uniquePageViews: totalPageViews, // 简化处理，使用总浏览量
        totalSessions: totalVisitors, // 简化处理，使用总访客数
        uniqueSessions: totalVisitors, // 简化处理，使用总访客数
      }

      return {
        code: 200,
        message: 'success',
        data: overviewData,
      }
    } catch (error) {
      console.error('获取访客概览数据失败:', error)
      return {
        code: 500,
        message: '获取访客概览数据失败',
        data: {
          totalVisits: 0,
          uniqueVisitors: 0,
          averageDuration: 0,
          bounceRate: 0,
          pagesPerSession: 0,
          newVisitors: 0,
          returningVisitors: 0,
          maxActivity: 0,
          totalPageViews: 0,
          uniquePageViews: 0,
          totalSessions: 0,
          uniqueSessions: 0,
        },
      }
    }
  },

  // 获取设备统计数据
  fetchDeviceStats: async (): Promise<
    ApiResponse<{ deviceTypes: VisitorDeviceType[]; deviceModels: DeviceModel[] }>
  > => {
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 简化处理，返回空数据结构
      return {
        code: 200,
        message: 'success',
        data: {
          deviceTypes: [],
          deviceModels: [],
        },
      }
    } catch (error) {
      console.error('获取设备统计数据失败:', error)
      return {
        code: 500,
        message: '获取设备统计数据失败',
        data: {
          deviceTypes: [],
          deviceModels: [],
        },
      }
    }
  },
}

export default api
