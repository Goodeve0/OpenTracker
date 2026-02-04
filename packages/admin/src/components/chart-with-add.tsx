import React, { useState } from 'react'
import { Card, Button, Tooltip } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ChartConfig } from '../types'
import { ChartType } from '../config/chart'
import { getDashboardConfig } from '../utils/dashboard-storage'

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

interface ChartWithAddProps {
  chartType: ChartType
  title: string
  description?: string
  defaultSize?: 'small' | 'medium' | 'large'
  category: string
  children: React.ReactNode
  loading?: boolean
}

const ChartWithAdd: React.FC<ChartWithAddProps> = ({
  chartType,
  title,
  description = '',
  defaultSize = 'medium',
  category,
  children,
  loading = false,
}) => {
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // 显示自定义提示
  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)

    // 3秒后自动关闭
    setTimeout(() => {
      setToastVisible(false)
    }, 3000)
  }

  // 处理添加到仪表板
  const handleAddToDashboard = () => {
    try {
      // 从本地存储获取当前仪表板配置
      const currentConfig = getDashboardConfig()

      // 检查是否已经添加过该图表类型
      const existingChart = currentConfig.charts.find((chart) => chart.type === chartType)
      if (existingChart) {
        showToast('该图表已添加到仪表板')
        return
      }

      // 创建新图表配置，直接使用defaultSize作为图表大小
      const newChart: ChartConfig = {
        id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: chartType,
        title: title,
        description: description,
        visible: true,
        position: currentConfig.charts.length,
        size: defaultSize,
        refreshInterval: 300,
      }

      // 更新配置
      const updatedConfig = {
        ...currentConfig,
        charts: [...currentConfig.charts, newChart],
        lastUpdated: Date.now(),
      }

      // 保存到本地存储
      localStorage.setItem('opentracker_dashboard_config', JSON.stringify(updatedConfig))

      // 使用自定义提示组件显示成功信息
      showToast('添加成功')
    } catch (error) {
      console.error('添加图表到仪表板失败:', error)
      // 使用自定义提示组件显示失败信息
      showToast('添加失败')
    }
  }

  return (
    <>
      {/* 自定义提示组件 */}
      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
      <Card
        title={title}
        extra={
          <Tooltip title="添加到仪表板">
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={handleAddToDashboard}
              size="small"
              style={{
                borderRadius: '50%',
                minWidth: '32px',
                height: '32px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                color: '#1890ff',
                background: 'transparent',
                transition: 'all 0.3s ease',
                fontSize: '18px',
              }}
              className="dashboard-add-button"
            />
          </Tooltip>
        }
        bordered
        hoverable
        loading={loading}
      >
        {children}
      </Card>
    </>
  )
}

export default ChartWithAdd
