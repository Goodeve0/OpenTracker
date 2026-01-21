import React, { useState, useEffect } from 'react'
import { Card, Spin, Empty, DatePicker, Select } from 'antd'
import { AreaChartOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../types'
import dayjs from 'dayjs'
import { Line } from '@ant-design/charts'

const { RangePicker } = DatePicker
const { Option } = Select

// 客户增长数据类型
interface CustomerGrowthData {
  date: string
  newUsers: number
  activeUsers: number
  totalUsers: number
}

// 图表数据类型
interface ChartData {
  date: string
  type: string
  value: number
}

// 时间范围选项
const timeRangeOptions = [
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
  { label: '最近90天', value: '90d' },
  { label: '自定义', value: 'custom' },
]

const CustomerGrowth: React.FC = () => {
  const [data, setData] = useState<CustomerGrowthData[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    null,
    null,
  ])
  const [period, setPeriod] = useState<string>('daily') // daily, weekly, monthly

  // 生成日期数组
  const generateDateArray = (days: number): string[] => {
    const dates: string[] = []
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - days + 1)

    let current = start
    while (current <= end) {
      dates.push(dayjs(current).format('YYYY-MM-DD'))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

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

  // 获取客户增长数据
  const fetchGrowthData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 从 localStorage 获取行为数据
      const behaviors = getBehaviorsFromLocalStorage()

      // 根据时间范围生成数据
      let days = 30
      let startDate: Date
      let endDate = new Date()

      switch (timeRange) {
        case '7d':
          days = 7
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          days = 30
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          days = 90
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 90)
          break
        case 'custom':
          if (customDateRange[0] && customDateRange[1]) {
            startDate = customDateRange[0].toDate()
            endDate = customDateRange[1].toDate()
            days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          } else {
            days = 30
            startDate = new Date()
            startDate.setDate(startDate.getDate() - 30)
          }
          break
        default:
          days = 30
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
      }

      // 生成日期数组
      const dates = generateDateArray(days)

      // 按日期分组统计行为数据
      const groupedByDate: Record<string, any[]> = {}
      dates.forEach((date) => {
        groupedByDate[date] = []
      })

      behaviors.forEach((behavior: any) => {
        const date = dayjs(behavior.timestamp).format('YYYY-MM-DD')
        if (groupedByDate[date]) {
          groupedByDate[date].push(behavior)
        }
      })

      // 计算增长数据
      let totalUsers = 0
      const growthData: CustomerGrowthData[] = dates.map((date) => {
        // 使用行为数据数量作为活跃用户数
        const activeUsers = groupedByDate[date].length
        // 简化处理，使用活跃用户数作为新增用户数
        const newUsers = activeUsers
        // 累计用户数
        totalUsers += newUsers

        return {
          date,
          newUsers,
          activeUsers,
          totalUsers,
        }
      })

      // 转换数据格式以适应@ant-design/plots Line组件，使用中文图例
      const convertedChartData = growthData.flatMap((item) => [
        { date: item.date, type: '新增用户', value: item.newUsers },
        { date: item.date, type: '活跃用户', value: item.activeUsers },
        { date: item.date, type: '累计用户', value: item.totalUsers },
      ])

      // 确认数据类型正确
      console.log('数据类型:', [...new Set(convertedChartData.map((item) => item.type))])
      console.log('数据示例:', convertedChartData.slice(0, 3))

      setData(growthData)
      setChartData(convertedChartData)
    } catch (err) {
      setError('获取客户增长数据失败')
      console.error('获取客户增长数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchGrowthData()
  }, [timeRange, customDateRange, period])

  // 处理时间范围变化
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
  }

  // 处理自定义日期范围变化
  const handleCustomDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null]) => {
    setCustomDateRange(dates)
    setTimeRange('custom')
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

  return (
    <div className="customer-growth-page" style={{ padding: '20px' }}>
      <ChartWithAdd
        chartType={ChartType.CUSTOMER_GROWTH}
        title="客户增长趋势"
        description="展示新增用户、活跃用户和累计用户的变化趋势"
        category="获客分析"
        defaultSize="large"
        loading={loading}
      >
        {error ? (
          <div className="text-center text-red-500 py-10">
            <p>{error}</p>
            <button
              onClick={fetchGrowthData}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重试
            </button>
          </div>
        ) : data.length > 0 ? (
          <div className="customer-growth-container">
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

            <div className="chart-container" style={{ height: 400 }}>
              <Line
                data={chartData}
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
                xAxis={{ label: { autoHide: true, autoRotate: true } }}
                yAxis={{ label: { formatter: (v: number) => v.toLocaleString() } }}
                point={{ size: 4, shape: 'circle' }}
                activePoint={{ size: 6 }}
              />
            </div>

            <div className="trend-summary mt-4 p-4 bg-gray-50 rounded">
              <h4 className="text-lg font-semibold mb-3">趋势分析</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 mb-1">近7天平均新增</div>
                  <div className="text-xl font-bold">
                    {data.length >= 7
                      ? Math.round(
                          data.slice(-7).reduce((sum, item) => sum + item.newUsers, 0) / 7
                        ).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">近30天平均活跃</div>
                  <div className="text-xl font-bold">
                    {data.length >= 30
                      ? Math.round(
                          data.slice(-30).reduce((sum, item) => sum + item.activeUsers, 0) / 30
                        ).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Empty
            description="暂无客户增长数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '40px 0' }}
          />
        )}
      </ChartWithAdd>
    </div>
  )
}

export default CustomerGrowth
