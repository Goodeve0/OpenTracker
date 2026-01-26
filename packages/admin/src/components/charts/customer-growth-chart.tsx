import React, { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { Line } from '@ant-design/charts' // 恢复使用Ant Design Charts
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { queryStatsData } from '../../api/track'

interface CustomerGrowthChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const CustomerGrowthChart: React.FC<CustomerGrowthChartProps> = ({
  title = '客户增长趋势',
  height = 300,
  loading = false,
}) => {
  const [data, setData] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [localLoading, setLocalLoading] = useState(false)

  // 从后端API获取客户增长数据
  useEffect(() => {
    const fetchGrowthData = async () => {
      setError(null)
      setLocalLoading(true)
      try {
        // 调用后端API获取客户增长数据
        const response = await queryStatsData({
          type: 'customer_growth',
          limit: 30,
        })

        if (response.code === 200 && response.data) {
          let growthData: any[] = []

          if (response.data.dates && response.data.values) {
            // 处理后端返回的数据格式
            let totalUsers = 0
            growthData = response.data.dates.map((date: string, index: number) => {
              const value = response.data.values[index] || 0
              const activeUsers = value
              const newUsers = value
              totalUsers += newUsers

              return {
                date,
                newUsers,
                activeUsers,
                totalUsers,
              }
            })
          } else if (Array.isArray(response.data)) {
            // 兼容数组格式数据
            growthData = response.data
          }

          setData(growthData)

          // 转换数据格式以适应@ant-design/plots Line组件，使用中文图例
          const convertedChartData = growthData.flatMap((item) => [
            { date: item.date, type: '新增用户', value: item.newUsers },
            { date: item.date, type: '活跃用户', value: item.activeUsers },
            { date: item.date, type: '累计用户', value: item.totalUsers },
          ])

          setChartData(convertedChartData)
        }
      } catch (err) {
        setError('获取客户增长数据失败')
        console.error('获取客户增长数据失败:', err)
        setData([]) // 确保数据为空，触发"暂无数据"显示
      } finally {
        setLocalLoading(false)
      }
    }

    fetchGrowthData()
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

  // 计算增长趋势
  const calculateGrowthTrend = () => {
    if (data.length < 2) return { trend: 'flat', percentage: 0 }

    const firstDay = data[0].newUsers
    const lastDay = data[data.length - 1].newUsers

    // 避免除以0
    if (firstDay === 0) return { trend: lastDay > 0 ? 'up' : 'flat', percentage: 0 }

    const percentage = ((lastDay - firstDay) / firstDay) * 100

    return {
      trend: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'flat',
      percentage: Math.abs(percentage).toFixed(1),
    }
  }

  const growthTrend = calculateGrowthTrend()

  // 无论是否有错误，只要数据为空就显示"暂无数据"
  const isEmptyData = !data || data.length === 0

  if (isEmptyData) {
    return (
      <div className="text-center text-gray-500 py-10">
        <p>暂无数据</p>
      </div>
    )
  }

  return (
    <div className="customer-growth-container">
      {data.length > 0 ? (
        <>
          <div className="growth-stats grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">新增用户</div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">
                  {data[data.length - 1].newUsers.toLocaleString()}
                </div>
                {growthTrend.trend === 'up' && (
                  <div className="text-green-500 flex items-center">
                    <ArrowUpOutlined />
                    <span>{growthTrend.percentage}%</span>
                  </div>
                )}
                {growthTrend.trend === 'down' && (
                  <div className="text-red-500 flex items-center">
                    <ArrowDownOutlined />
                    <span>{growthTrend.percentage}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">活跃用户</div>
              <div className="text-2xl font-bold">
                {data[data.length - 1].activeUsers.toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="text-gray-500 text-sm mb-1">累计用户</div>
              <div className="text-2xl font-bold">
                {data[data.length - 1].totalUsers.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="chart-container" style={{ height }}>
            <Line
              data={chartData}
              // 恢复与获客分析页面完全相同的配置
              xField="date"
              yField="value"
              seriesField="type"
              smooth
              series={[
                {
                  name: '新增用户',
                  style: {
                    line: {
                      stroke: '#1890ff',
                      lineWidth: 2,
                    },
                    point: {
                      fill: '#1890ff',
                    },
                  },
                },
                {
                  name: '活跃用户',
                  style: {
                    line: {
                      stroke: '#52c41a',
                      lineWidth: 2,
                    },
                    point: {
                      fill: '#52c41a',
                    },
                  },
                },
                {
                  name: '累计用户',
                  style: {
                    line: {
                      stroke: '#ff7875',
                      lineWidth: 2,
                    },
                    point: {
                      fill: '#ff7875',
                    },
                  },
                },
              ]}
              label={{ style: { fill: '#aaa' } }}
              tooltip={{ formatter: (datum: any) => `${datum.date}: ${datum.value}` }}
              legend={{ position: 'top' }}
              // 与原始页面保持一致的xAxis配置
              xAxis={{ label: { autoHide: true, autoRotate: true } }}
              yAxis={{ label: { formatter: (v: number) => v.toLocaleString() } }}
              point={{ size: 4, shape: 'circle' }}
              activePoint={{ size: 6 }}
            />
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-10">
          <p>暂无数据</p>
        </div>
      )}
    </div>
  )
}

export default CustomerGrowthChart
