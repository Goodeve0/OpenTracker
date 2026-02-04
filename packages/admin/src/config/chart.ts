import { ChartOption } from '../types'

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

// 可添加的图表选项
export const CHART_OPTIONS: ChartOption[] = [
  {
    type: ChartType.VISITOR_TRENDS,
    title: '访客趋势',
    description: '展示网站访客数量的变化趋势',
    category: '访客分析',
    defaultSize: 'large',
  },
  {
    type: ChartType.VISITOR_DEVICE,
    title: '设备分布',
    description: '展示访客使用的设备类型分布',
    category: '访客分析',
    defaultSize: 'medium',
  },
  {
    type: ChartType.BEHAVIOR_EVENTS,
    title: '事件分析',
    description: '展示用户行为事件的统计',
    category: '行为分析',
    defaultSize: 'medium',
  },
  {
    type: ChartType.BEHAVIOR_PAGE_VIEWS,
    title: '页面访问',
    description: '展示页面访问量的统计',
    category: '行为分析',
    defaultSize: 'medium',
  },
  {
    type: ChartType.CUSTOMER_GROWTH,
    title: '用户增长',
    description: '展示用户增长趋势',
    category: '获客分析',
    defaultSize: 'large',
  },
  {
    type: ChartType.CUSTOMER_SOURCE,
    title: '来源分析',
    description: '展示用户来源渠道分布',
    category: '获客分析',
    defaultSize: 'medium',
  },
  {
    type: ChartType.ERROR_TRENDS,
    title: '错误趋势',
    description: '展示网站错误数量的变化趋势',
    category: '错误分析',
    defaultSize: 'large',
  },
  {
    type: ChartType.ERROR_TYPE,
    title: '错误类型分布',
    description: '展示各类错误的分布情况',
    category: '错误分析',
    defaultSize: 'medium',
  },
  {
    type: ChartType.PERFORMANCE_OVERVIEW,
    title: '性能概览',
    description: '展示网站性能指标概览',
    category: '性能分析',
    defaultSize: 'large',
  },
  {
    type: ChartType.PERFORMANCE_TRENDS,
    title: '性能趋势',
    description: '展示网站性能指标变化趋势',
    category: '性能分析',
    defaultSize: 'large',
  },
  {
    type: ChartType.WHITE_SCREEN_TRENDS,
    title: '白屏趋势',
    description: '展示白屏问题的发生趋势',
    category: '白屏监控',
    defaultSize: 'medium',
  },
  {
    type: ChartType.WHITE_SCREEN_TOP_PAGES,
    title: '白屏TOP页面',
    description: '展示白屏问题最多的页面',
    category: '白屏监控',
    defaultSize: 'medium',
  },
  {
    type: ChartType.HIGH_ERROR_PAGES,
    title: '高频报错页面',
    description: '展示错误率最高的页面',
    category: '错误分析',
    defaultSize: 'medium',
  },
]
