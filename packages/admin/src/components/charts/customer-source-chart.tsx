import React, { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { Pie } from '@ant-design/charts'

// 从原页面复制的获取行为数据的函数
const getBehaviorsFromLocalStorage = (): any[] => {
  try {
    const behaviors = localStorage.getItem('behaviors')
    return behaviors ? JSON.parse(behaviors) : []
  } catch (error) {
    console.error('从 localStorage 获取行为数据失败:', error)
    return []
  }
}

interface CustomerSourceChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const CustomerSourceChart: React.FC<CustomerSourceChartProps> = ({
  title = '客户来源分析',
  height = 300,
  loading = false,
}) => {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // 从原页面复制的完整数据获取和处理逻辑
  useEffect(() => {
    const fetchSourceData = async () => {
      setError(null)
      try {
        // 从 localStorage 获取行为数据 - 与原页面完全相同
        const behaviors = getBehaviorsFromLocalStorage()

        // 模拟客户来源数据（基于行为数据） - 与原页面完全相同
        // 由于真实行为数据中可能没有来源信息，我们使用行为类型作为来源分类
        const sourceCounts: Record<string, number> = {}

        behaviors.forEach((behavior: any) => {
          const sourceType = behavior.type || 'direct' // 使用行为类型作为来源 - 与原页面完全相同
          sourceCounts[sourceType] = (sourceCounts[sourceType] || 0) + 1
        })

        // 转换为用户友好的来源名称 - 与原页面完全相同
        const sourceMapping: Record<string, string> = {
          behavior: '直接访问',
          page_view: '页面访问',
          click: '点击事件',
          scroll: '滚动事件',
          search: '搜索事件',
          direct: '直接访问',
          default: '其他来源',
        }

        // 计算总行为数 - 与原页面完全相同
        const totalBehaviors = behaviors.length

        // 生成来源数据 - 与原页面完全相同
        const sourceData = Object.entries(sourceCounts)
          .map(([key, value]) => ({
            name: sourceMapping[key] || sourceMapping['default'],
            value: totalBehaviors > 0 ? (value / totalBehaviors) * 100 : 0,
          }))
          .sort((a, b) => b.value - a.value) // 按占比降序排序 - 与原页面完全相同

        setData(sourceData)
      } catch (err) {
        setError('获取客户来源数据失败')
        console.error('获取客户来源数据失败:', err)
      }
    }

    fetchSourceData()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin />
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff4d4f',
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <Pie
        data={data}
        angleField="value"
        colorField="name"
        color={['#1890ff', '#52c41a', '#722ed1', '#faad14']}
        label={{
          type: 'outer',
          content: (datum: any) => `${datum.name}: ${datum.value}%`,
        }}
        tooltip={{ formatter: (datum: any) => `${datum.name}: ${datum.value}%` }}
        // 添加自适应配置，防止标签溢出
        padding="auto"
        fit="true"
      />
    </div>
  )
}

export default CustomerSourceChart
