import React, { useState, useEffect } from 'react'
import { Card, Spin, Empty } from 'antd'
import { Pie } from '@ant-design/charts'
import { PieChartOutlined } from '@ant-design/icons'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../config/chart'
import { queryStatsData } from '../../api/track'

// 客户来源数据类型
interface CustomerSourceData {
  name: string
  value: number
}

const CustomerSource: React.FC = () => {
  const [data, setData] = useState<CustomerSourceData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取客户来源数据
  const fetchSourceData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 从API获取客户来源数据
      const response = await queryStatsData({
        type: 'customerSource',
        limit: 10,
      })

      if (response.code === 200 && response.data) {
        // 来源名称映射（英文转中文）
        const sourceNameMap: Record<string, string> = {
          direct: '直接访问',
          organic: '自然搜索',
          social: '社交媒体',
          referral: '推荐访问',
          mobile: '移动设备',
          email: '邮件营销',
          paid: '付费广告',
        }

        // 处理后端返回的数据，将value格式化为两位小数
        const sourceData: any[] = response.data
          .map((item: any) => ({
            name: sourceNameMap[item.name] || '其他来源',
            value: typeof item.value === 'number' ? Number(item.value.toFixed(2)) : 0,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value)

        console.log('饼图数据:', sourceData)
        setData(sourceData)
      } else {
        setError('获取客户来源数据失败')
        setData([])
      }
    } catch (err) {
      console.error('获取客户来源数据失败:', err)
      setError('获取客户来源数据失败')
      setData([])
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
                color={['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96']}
                label={{
                  visible: true,
                  formatter: (datum: any) => {
                    if (!datum || typeof datum.value !== 'number') {
                      return ''
                    }
                    return `${datum.value.toFixed(2)}%`
                  },
                }}
                tooltip={{
                  formatter: (datum: any) => {
                    if (!datum || typeof datum.value !== 'number') {
                      return ''
                    }
                    return `${datum.name}: ${datum.value.toFixed(2)}%`
                  },
                }}
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
                        <span className="text-gray-500">{item.value.toFixed(2)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${item.value.toFixed(2)}%`,
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
