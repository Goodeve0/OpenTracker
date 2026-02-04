import React from 'react'
import { ChartConfig } from '../../../types'
import { ChartType } from '../../../config/chart'
import VisitorChart from '../../../components/charts/visitor-chart'
import ErrorTrendsChart from '../../../components/charts/error-trends-chart'
import ErrorTypeChart from '../../../components/charts/error-type-chart'
import TopErrorsChart from '../../../components/charts/top-errors-chart'
import CustomerGrowthChart from '../../../components/charts/customer-growth-chart'
import CustomerSourceChart from '../../../components/charts/customer-source-chart'
import PerformanceOverviewChart from '../../../components/charts/performance-overview-chart'
import PerformanceTrendsChart from '../../../components/charts/performance-trends-chart'
import WhiteScreenTrendsChart from '../../../components/charts/white-screen-trends-chart'

// 渲染图表组件
const renderChartComponent = (config: ChartConfig) => {
  // 根据图表类型渲染对应的图表组件，确保图表类型和数据完全一致
  switch (config.type) {
    // 访客分析 - 访客趋势图（使用与访客分析页面相同的SVG图表）
    case ChartType.VISITOR_TRENDS:
      return <VisitorChart height={400} viewType="visitors" />

    // 访客分析 - 设备分布（暂时使用访客图表，后续可替换为设备分布图表）
    case ChartType.VISITOR_DEVICE:
      return <VisitorChart height={400} viewType="visitors" />

    // 错误分析 - 错误趋势（多折线图 - 与错误分析页面一致）
    case ChartType.ERROR_TRENDS:
      return <ErrorTrendsChart height={350} />

    // 错误分析 - 错误类型分布（饼图）
    case ChartType.ERROR_TYPE:
      return <ErrorTypeChart height={300} />

    // 错误分析 - 高频报错页面（柱状图 - 与错误分析页面一致）
    case ChartType.HIGH_ERROR_PAGES:
      return <TopErrorsChart height={300} />

    // 行为分析 - 事件分析（暂时使用占位符）
    case ChartType.BEHAVIOR_EVENTS:
    // 行为分析 - 页面访问（暂时使用占位符）
    case ChartType.BEHAVIOR_PAGE_VIEWS:
    // 白屏监控 - 白屏TOP页面（暂时使用占位符）
    case ChartType.WHITE_SCREEN_TOP_PAGES:
      // 对于未实现的类型，显示带有详细信息的占位符
      return (
        <div
          style={{
            height: config.size === 'large' ? 400 : 300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
            padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>{config.title}</h3>
          <p style={{ margin: '0 0 15px 0', textAlign: 'center' }}>{config.description}</p>
          <div
            style={{
              fontSize: '14px',
              backgroundColor: '#f5f5f5',
              padding: '8px 16px',
              borderRadius: '4px',
              marginBottom: '10px',
            }}
          >
            图表类型：{config.type}
          </div>
          <div style={{ fontSize: '12px', textAlign: 'center', color: '#8c8c8c' }}>
            该图表类型的组件正在开发中，敬请期待
          </div>
        </div>
      )

    // 获客分析 - 用户增长（多折线图）
    case ChartType.CUSTOMER_GROWTH:
      return <CustomerGrowthChart height={400} />

    // 获客分析 - 来源分析（饼图）
    case ChartType.CUSTOMER_SOURCE:
      return <CustomerSourceChart height={400} />

    // 性能分析 - 性能概览（饼图）
    case ChartType.PERFORMANCE_OVERVIEW:
      return <PerformanceOverviewChart height={400} />

    // 性能分析 - 性能趋势（折线图）
    case ChartType.PERFORMANCE_TRENDS:
      return <PerformanceTrendsChart height={400} />

    // 白屏监控 - 白屏趋势（多折线图）
    case ChartType.WHITE_SCREEN_TRENDS:
      return <WhiteScreenTrendsChart height={400} />

    default:
      // 对于其他类型，显示带有详细信息的占位符
      return (
        <div
          style={{
            height: config.size === 'large' ? 400 : 300,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
            padding: '20px',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>{config.title}</h3>
          <p style={{ margin: '0 0 15px 0', textAlign: 'center' }}>{config.description}</p>
          <div
            style={{
              fontSize: '14px',
              backgroundColor: '#f5f5f5',
              padding: '8px 16px',
              borderRadius: '4px',
              marginBottom: '10px',
            }}
          >
            图表类型：{config.type}
          </div>
          <div style={{ fontSize: '12px', textAlign: 'center', color: '#8c8c8c' }}>
            该图表类型的组件正在开发中，敬请期待
          </div>
        </div>
      )
  }
}

export default renderChartComponent
