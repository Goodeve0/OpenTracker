import { VisitorDataPoint } from '../api/visitor'

// 定义数据类型
export interface GrowthRates {
  totalVisits: number
  uniqueVisitors: number
  averageDuration: number
  bounceRate: number
  pagesPerSession: number
  newVisitors: number
  returningVisitors: number
  totalPageViews: number
  uniquePageViews: number
}

// 添加缺失的接口定义
export interface Tick {
  x: number
  date: string
}

export interface YTick {
  y: number
  value: string
}

export interface LineChartProps {
  data: VisitorDataPoint[]
  width?: number
  height?: number
  viewType?: 'visitors' | 'pageViews'
}

export interface StatCardProps {
  title: string
  value: number | string
  unit?: string
  rate?: number
  description?: string
  color?: string
}
