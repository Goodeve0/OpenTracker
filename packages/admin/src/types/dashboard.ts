// 定义图表类型枚举
export enum ChartType {
  VISITOR_TRENDS = 'visitorTrends',
  VISITOR_DEVICE = 'visitorDevice',
  BEHAVIOR_EVENTS = 'behaviorEvents',
  BEHAVIOR_PAGE_VIEWS = 'behaviorPageViews',
  CUSTOMER_GROWTH = 'customerGrowth',
  CUSTOMER_SOURCE = 'customerSource',
  ERROR_TRENDS = 'errorTrends',
  ERROR_TYPE = 'errorType',
  PERFORMANCE_OVERVIEW = 'performanceOverview',
  WHITE_SCREEN_TRENDS = 'whiteScreenTrends',
  WHITE_SCREEN_TOP_PAGES = 'whiteScreenTopPages',
  HIGH_ERROR_PAGES = 'highErrorPages',
  PERFORMANCE_TRENDS = 'performanceTrends',
}

// 定义图表基础配置
export interface ChartConfig {
  id: string // 唯一标识符
  type: ChartType // 图表类型
  title: string // 图表标题
  description?: string // 图表描述
  visible: boolean // 是否可见
  position: number // 显示位置
  size: 'small' | 'medium' | 'large' // 图表大小
  refreshInterval?: number // 刷新间隔（秒）
  config?: Record<string, any> // 图表特定配置
}

// 定义仪表板配置
export interface DashboardConfig {
  charts: ChartConfig[] // 图表配置列表
  lastUpdated: number // 最后更新时间
}

// 定义可添加的图表选项
export interface ChartOption {
  type: ChartType
  title: string
  description: string
  category: string
  defaultSize: 'small' | 'medium' | 'large'
}
