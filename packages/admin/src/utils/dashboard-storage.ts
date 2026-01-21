import { DashboardConfig, ChartConfig, ChartType } from '../types'

// 本地存储键名
const STORAGE_KEY = 'opentracker_dashboard_config'

// 默认仪表板配置
const DEFAULT_CONFIG: DashboardConfig = {
  charts: [
    {
      id: 'default-visitor-trends',
      type: ChartType.VISITOR_TRENDS,
      title: '访客趋势',
      description: '展示网站访客数量的变化趋势',
      visible: true,
      position: 0,
      size: 'large',
      refreshInterval: 300,
    },
    {
      id: 'default-error-trends',
      type: ChartType.ERROR_TRENDS,
      title: '错误趋势',
      description: '展示网站各类错误的分布情况',
      visible: true,
      position: 1,
      size: 'medium',
      refreshInterval: 300,
    },
  ],
  lastUpdated: Date.now(),
}

/**
 * 保存仪表板配置到本地存储
 * @param config 仪表板配置
 */
export const saveDashboardConfig = (config: DashboardConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('保存仪表板配置失败:', error)
  }
}

/**
 * 从本地存储读取仪表板配置
 * @returns 仪表板配置
 */
export const getDashboardConfig = (): DashboardConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as DashboardConfig
    }
    return DEFAULT_CONFIG
  } catch (error) {
    console.error('读取仪表板配置失败:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * 重置仪表板配置到默认值
 */
export const resetDashboardConfig = (): void => {
  saveDashboardConfig(DEFAULT_CONFIG)
}

/**
 * 添加图表到仪表板配置
 * @param config 仪表板配置
 * @param chart 要添加的图表配置
 * @returns 更新后的仪表板配置
 */
export const addChartToConfig = (
  config: DashboardConfig,
  chart: Omit<ChartConfig, 'id' | 'position' | 'visible'>
): DashboardConfig => {
  const newChart: ChartConfig = {
    ...chart,
    id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position: config.charts.length,
    visible: true,
  }

  const updatedConfig: DashboardConfig = {
    ...config,
    charts: [...config.charts, newChart],
    lastUpdated: Date.now(),
  }

  saveDashboardConfig(updatedConfig)
  return updatedConfig
}

/**
 * 从仪表板配置中删除图表
 * @param config 仪表板配置
 * @param chartId 要删除的图表ID
 * @returns 更新后的仪表板配置
 */
export const removeChartFromConfig = (
  config: DashboardConfig,
  chartId: string
): DashboardConfig => {
  const updatedCharts = config.charts
    .filter((chart) => chart.id !== chartId)
    .map((chart, index) => ({ ...chart, position: index }))

  const updatedConfig: DashboardConfig = {
    ...config,
    charts: updatedCharts,
    lastUpdated: Date.now(),
  }

  saveDashboardConfig(updatedConfig)
  return updatedConfig
}

/**
 * 更新图表配置
 * @param config 仪表板配置
 * @param chartId 要更新的图表ID
 * @param updates 要更新的配置
 * @returns 更新后的仪表板配置
 */
export const updateChartConfig = (
  config: DashboardConfig,
  chartId: string,
  updates: Partial<ChartConfig>
): DashboardConfig => {
  const updatedCharts = config.charts.map((chart) => {
    if (chart.id === chartId) {
      return { ...chart, ...updates }
    }
    return chart
  })

  const updatedConfig: DashboardConfig = {
    ...config,
    charts: updatedCharts,
    lastUpdated: Date.now(),
  }

  saveDashboardConfig(updatedConfig)
  return updatedConfig
}
