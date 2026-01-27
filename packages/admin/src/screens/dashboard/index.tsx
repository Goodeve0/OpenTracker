import React, { useState, useEffect } from 'react'
import { Layout, Row, Col, Button, Modal, Select, Space, notification } from 'antd'
import { ChartConfig, ChartType, ChartOption } from '../../types'
import {
  getDashboardConfig,
  removeChartFromConfig,
  saveDashboardConfig,
} from '../../utils/dashboard-storage'
import ChartContainer from '../../components/chart-container'
import VisitorChart from '../../components/charts/visitor-chart'
import ErrorTrendsChart from '../../components/charts/error-trends-chart'
import ErrorTypeChart from '../../components/charts/error-type-chart'
import TopErrorsChart from '../../components/charts/top-errors-chart'
import CustomerGrowthChart from '../../components/charts/customer-growth-chart'
import CustomerSourceChart from '../../components/charts/customer-source-chart'
import PerformanceOverviewChart from '../../components/charts/performance-overview-chart'
import PerformanceTrendsChart from '../../components/charts/performance-trends-chart'
import WhiteScreenTrendsChart from '../../components/charts/white-screen-trends-chart'
// 添加拖拽相关导入
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const { Content } = Layout
const { Option } = Select

// 可添加的图表选项
const CHART_OPTIONS: ChartOption[] = [
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

// 自定义提示组件
const Toast: React.FC<{ message: string; visible: boolean; onClose: () => void }> = ({
  message,
  visible,
  onClose,
}) => {
  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px', // 与顶部导航栏同高
        left: '50%',
        transform: 'translate(-50%, 0)',
        backgroundColor: message === '删除成功' ? '#ff4d4f' : '#52c41a',
        color: '#fff',
        padding: '8px 16px', // 尺寸小一点
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-in-out',
        textAlign: 'center',
        fontSize: '14px', // 字体小一点
      }}
    >
      {message}
    </div>
  )
}

const DashboardPage: React.FC = () => {
  const [dashboardConfig, setDashboardConfig] = useState(getDashboardConfig())
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null)
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [afterChartId, setAfterChartId] = useState<string | null>(null) // 记录要在哪个图表后添加
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // 添加拖拽相关配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    // 获取被拖动图表和目标图表
    const draggedChartId = active.id as string
    const targetChartId = over.id as string

    // 检查是否是同一个图表
    if (draggedChartId === targetChartId) {
      return
    }

    // 创建图表数组副本
    const newCharts = [...dashboardConfig.charts]

    // 获取索引
    const draggedIndex = newCharts.findIndex((chart) => chart.id === draggedChartId)
    const targetIndex = newCharts.findIndex((chart) => chart.id === targetChartId)

    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    // 保存被拖动图表和目标图表的原始数据
    const originalDraggedChart = { ...newCharts[draggedIndex] }
    const originalTargetChart = { ...newCharts[targetIndex] }

    // 检查是否是插入操作
    // 插入操作：当拖动到相邻位置时
    const isInsertOperation = Math.abs(draggedIndex - targetIndex) === 1

    if (isInsertOperation) {
      // 插入操作：拖动到图表之间的空白区域
      // 使用arrayMove实现插入，保持原始大小
      const updatedCharts = arrayMove(newCharts, draggedIndex, targetIndex)

      // 更新position属性
      const finalCharts = updatedCharts.map((chart, index) => ({
        ...chart,
        position: index,
      }))

      // 更新配置
      const updatedConfig = {
        ...dashboardConfig,
        charts: finalCharts,
        lastUpdated: Date.now(),
      }

      // 保存到本地存储
      saveDashboardConfig(updatedConfig)

      // 更新状态
      setDashboardConfig(updatedConfig)
    } else {
      // 交换操作：拖动到图表上方，无论尺寸是否相同都执行交换
      // 步骤1：先将被拖动图表从原位置移除
      newCharts.splice(draggedIndex, 1)

      // 步骤2：将被拖动图表插入到目标位置
      newCharts.splice(targetIndex, 0, originalDraggedChart)

      // 步骤3：找到交换后的两个图表
      const swappedDraggedIndex = newCharts.findIndex((chart) => chart.id === draggedChartId)
      const swappedTargetIndex = newCharts.findIndex((chart) => chart.id === targetChartId)

      if (swappedDraggedIndex !== -1 && swappedTargetIndex !== -1) {
        // 步骤4：交换两个图表的大小
        const tempSize = newCharts[swappedDraggedIndex].size
        newCharts[swappedDraggedIndex].size = newCharts[swappedTargetIndex].size
        newCharts[swappedTargetIndex].size = tempSize
      }

      // 更新position属性
      const finalCharts = newCharts.map((chart, index) => ({
        ...chart,
        position: index,
      }))

      // 更新配置
      const updatedConfig = {
        ...dashboardConfig,
        charts: finalCharts,
        lastUpdated: Date.now(),
      }

      // 保存到本地存储
      saveDashboardConfig(updatedConfig)

      // 更新状态
      setDashboardConfig(updatedConfig)
    }
  }

  // 从本地存储加载配置
  useEffect(() => {
    setDashboardConfig(getDashboardConfig())
  }, [])

  // 处理在指定图表后添加新图表
  const handleAddChartAfter = (afterId: string) => {
    setAfterChartId(afterId)
    setIsAddModalVisible(true)
  }

  // 处理添加图表
  const handleAddChart = () => {
    if (!selectedChartType) return

    const chartOption = CHART_OPTIONS.find((option) => option.type === selectedChartType)
    if (!chartOption) return

    // 创建新图表配置
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: selectedChartType,
      title: chartOption.title,
      description: chartOption.description,
      visible: true,
      position: 0, // 暂时设为0，后面会重新计算
      size: selectedSize,
      refreshInterval: 300,
    }

    // 找到要插入的位置
    const afterChartIndex = dashboardConfig.charts.findIndex((chart) => chart.id === afterChartId)
    const newCharts = [...dashboardConfig.charts]

    if (afterChartIndex >= 0) {
      // 在指定图表后插入
      newCharts.splice(afterChartIndex + 1, 0, newChart)
    } else {
      // 如果找不到，就添加到末尾
      newCharts.push(newChart)
    }

    // 重新计算所有图表的位置
    const updatedCharts = newCharts.map((chart, index) => ({
      ...chart,
      position: index,
    }))

    // 更新配置
    const updatedConfig = {
      ...dashboardConfig,
      charts: updatedCharts,
      lastUpdated: Date.now(),
    }

    // 保存到本地存储
    localStorage.setItem('opentracker_dashboard_config', JSON.stringify(updatedConfig))

    setDashboardConfig(updatedConfig)
    setIsAddModalVisible(false)
    setSelectedChartType(null)
    setSelectedSize('medium')
    setAfterChartId(null)
  }

  // 显示自定义提示
  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)

    // 3秒后自动关闭
    setTimeout(() => {
      setToastVisible(false)
    }, 3000)
  }

  // 处理删除图表
  const handleDeleteChart = (id: string) => {
    const newConfig = removeChartFromConfig(dashboardConfig, id)
    setDashboardConfig(newConfig)
    // 使用自定义提示组件显示成功信息
    showToast('删除成功')
  }

  // 处理图表尺寸变化
  const handleSizeChange = (id: string, size: 'small' | 'medium' | 'large') => {
    const newCharts = dashboardConfig.charts.map((chart) => {
      if (chart.id === id) {
        return {
          ...chart,
          size,
        }
      }
      return chart
    })

    // 更新配置
    const updatedConfig = {
      ...dashboardConfig,
      charts: newCharts,
      lastUpdated: Date.now(),
    }

    // 保存到本地存储
    saveDashboardConfig(updatedConfig)

    // 更新状态
    setDashboardConfig(updatedConfig)
  }

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

  // 获取图表大小对应的列数
  const getChartColSpan = (size: string) => {
    switch (size) {
      case 'small':
        return 8
      case 'medium':
        return 12
      case 'large':
        return 24
      default:
        return 12
    }
  }

  return (
    <Layout className="dashboard-page" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 自定义提示组件 */}
      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
      <Content
        style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: '8px' }}
      >
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>报表面板</h2>
        </div>

        {/* 空状态提示 */}
        {dashboardConfig.charts.filter((chart) => chart.visible).length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px',
              color: '#1890ff',
              fontSize: '18px',
              textAlign: 'center',
              backgroundColor: '#f0f8ff',
              borderRadius: '8px',
              border: '2px dashed #91d5ff',
            }}
          >
            <div style={{ marginBottom: '16px', fontSize: '24px' }}>📊</div>
            <div>暂无图表数据</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
              请从其他分析页面添加图表到此处
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={dashboardConfig.charts
                .filter((chart) => chart.visible)
                .sort((a, b) => a.position - b.position)
                .map((chart) => chart.id)}
            >
              <Row gutter={[16, 16]}>
                {dashboardConfig.charts
                  .filter((chart) => chart.visible)
                  .sort((a, b) => a.position - b.position)
                  .map((chart) => (
                    <Col key={chart.id} span={getChartColSpan(chart.size)}>
                      <ChartContainer
                        config={chart}
                        onDelete={handleDeleteChart}
                        onSizeChange={handleSizeChange}
                      >
                        {renderChartComponent(chart)}
                      </ChartContainer>
                    </Col>
                  ))}
              </Row>
            </SortableContext>
          </DndContext>
        )}

        {/* 添加图表弹窗 */}
        <Modal
          title="添加图表"
          open={isAddModalVisible}
          onOk={handleAddChart}
          onCancel={() => setIsAddModalVisible(false)}
          okText="添加"
          cancelText="取消"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <h4 style={{ marginBottom: 8 }}>选择图表类型</h4>
              <Select
                style={{ width: '100%' }}
                placeholder="请选择图表类型"
                value={selectedChartType || undefined}
                onChange={(value) => {
                  setSelectedChartType(value)
                  const chartOption = CHART_OPTIONS.find((option) => option.type === value)
                  if (chartOption) {
                    setSelectedSize(chartOption.defaultSize)
                  }
                }}
              >
                {CHART_OPTIONS.map((option) => (
                  <Option key={option.type} value={option.type}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{option.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {option.category} - {option.description}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <h4 style={{ marginBottom: 8 }}>图表大小</h4>
              <Select
                style={{ width: '100%' }}
                value={selectedSize}
                onChange={(value) => setSelectedSize(value as 'small' | 'medium' | 'large')}
              >
                <Option value="small">小 (1/3 宽度)</Option>
                <Option value="medium">中 (1/2 宽度)</Option>
                <Option value="large">大 (全屏宽度)</Option>
              </Select>
            </div>
          </Space>
        </Modal>
      </Content>
    </Layout>
  )
}

export default DashboardPage
