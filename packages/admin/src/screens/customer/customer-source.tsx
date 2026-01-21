import React, { useState, useEffect } from 'react'
import { Card, Spin, Empty } from 'antd'
import { Pie } from '@ant-design/charts'
import { PieChartOutlined } from '@ant-design/icons'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../types'

// 客户来源数据类型
interface CustomerSourceData {
  name: string
  value: number
}

const CustomerSource: React.FC = () => {
  const [data, setData] = useState<CustomerSourceData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // 获取客户来源数据
  const fetchSourceData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 模拟客户来源数据（基于行为数据）
      // 由于真实行为数据中可能没有来源信息，我们使用行为类型作为来源分类
      const sourceCounts: Record<string, number> = {}

      behaviors.forEach((behavior: any) => {
        const sourceType = behavior.type || 'direct' // 使用行为类型作为来源
        sourceCounts[sourceType] = (sourceCounts[sourceType] || 0) + 1
      })

      // 转换为用户友好的来源名称
      const sourceMapping: Record<string, string> = {
        behavior: '直接访问',
        page_view: '页面访问',
        click: '点击事件',
        scroll: '滚动事件',
        search: '搜索事件',
        direct: '直接访问',
        default: '其他来源',
      }

      // 计算总行为数
      const totalBehaviors = behaviors.length

      // 生成来源数据
      const sourceData: CustomerSourceData[] = Object.entries(sourceCounts)
        .map(([key, value]) => ({
          name: sourceMapping[key] || sourceMapping['default'],
          value: totalBehaviors > 0 ? (value / totalBehaviors) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value) // 按占比降序排序

      // 如果没有数据，返回空数组
      if (sourceData.length === 0) {
        setData([])
      } else {
        setData(sourceData)
      }
    } catch (err) {
      setError('获取客户来源数据失败')
      console.error('获取客户来源数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchSourceData()
  }, [])

  // 处理重新加载
  const handleReload = () => {
    fetchSourceData()
  }

  return (
    <div className="customer-source-page" style={{ padding: '20px' }}>
      <ChartWithAdd
        chartType={ChartType.CUSTOMER_SOURCE}
        title="客户来源分析"
        description="展示用户来源渠道的分布情况"
        category="获客分析"
        defaultSize="large"
        loading={loading}
      >
        {error ? (
          <div className="text-center text-red-500 py-10">
            <p>{error}</p>
            <button
              onClick={handleReload}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重试
            </button>
          </div>
        ) : data.length > 0 ? (
          <div className="customer-source-container">
            <div className="chart-container" style={{ height: 400 }}>
              <Pie
                data={data}
                angleField="value"
                colorField="name"
                color={['#1890ff', '#52c41a', '#722ed1']}
                label={{
                  type: 'outer',
                  content: (datum: any) => `${datum.name}: ${datum.value}%`,
                }}
                tooltip={{ formatter: (datum: any) => `${datum.name}: ${datum.value}%` }}
              />
            </div>

            <div className="source-list mt-4">
              <h4 className="text-lg font-semibold mb-3">来源详情</h4>
              <div className="grid grid-cols-2 gap-3">
                {data.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{
                        backgroundColor: ['#1890ff', '#52c41a', '#722ed1'][index],
                      }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500">{item.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${item.value}%`,
                            backgroundColor: ['#1890ff', '#52c41a', '#722ed1'][index],
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Empty
            description="暂无客户来源数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '40px 0' }}
          />
        )}
      </ChartWithAdd>
    </div>
  )
}

export default CustomerSource
