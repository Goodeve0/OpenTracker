import React, { useState, useEffect } from 'react'
import { Layout, Row, Col, Button, Modal, Select, Space, notification } from 'antd'
import { ChartConfig } from '../../types'
import { CHART_OPTIONS, ChartType } from '../../config/chart'
import {
  getDashboardConfig,
  removeChartFromConfig,
  saveDashboardConfig,
} from '../../utils/dashboard-storage'
import ChartContainer from '../../components/chart-container'
import Toast from './components/Toast'
import renderChartComponent from './components/RenderChart'
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
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000e0' }}>报表面板</div>
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
