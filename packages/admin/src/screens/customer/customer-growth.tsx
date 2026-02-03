import React, { useState, useEffect } from 'react'
import { Card, Spin, Empty, DatePicker, Select } from 'antd'
import { AreaChartOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../config/chart'
import dayjs from 'dayjs'
import { Line } from '@ant-design/charts'
import { queryStatsData } from '../../api/track'

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

  // 获取客户增长数据
  const fetchGrowthData = async () => {
    console.log('开始获取客户增长数据')
    setLoading(true)
    setError(null)
    try {
      // 使用最近30天的时间范围，确保能够获取到测试数据
      const endDate = dayjs()
      const startDate = dayjs().subtract(30, 'day')

      console.log('时间范围:', {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD'),
      })

      // 从API获取客户增长数据
      console.log('调用queryStatsData API')
      const response = await queryStatsData({
        type: 'customerGrowth',
        startTime: startDate.startOf('day').valueOf(),
        endTime: endDate.endOf('day').valueOf(),
        limit: endDate.diff(startDate, 'day') + 1,
      })

      console.log('API响应:', response)

      if (response && response.code === 200 && response.data) {
        // 处理后端返回的数据
        console.log('客户增长数据:', response.data)
        const growthData: CustomerGrowthData[] = response.data.map((item: any) => ({
          date: dayjs(item.timestamp).format('YYYY-MM-DD'),
          newUsers: typeof item.newUsers === 'number' ? item.newUsers : 0,
          activeUsers: typeof item.activeUsers === 'number' ? item.activeUsers : 0,
          totalUsers: typeof item.totalUsers === 'number' ? item.totalUsers : 0,
        }))

        // 转换数据格式以适应@ant-design/plots Line组件，使用中文图例
        const convertedChartData = growthData.flatMap((item) => [
          { date: item.date, type: '新增用户', value: item.newUsers },
          { date: item.date, type: '活跃用户', value: item.activeUsers },
          { date: item.date, type: '累计用户', value: item.totalUsers },
        ])

        console.log('处理后的图表数据:', convertedChartData)
        console.log('数据长度:', growthData.length)

        setData(growthData)
        setChartData(convertedChartData)
      } else {
        console.error('获取客户增长数据失败:', response?.message || '未知错误')
        setError('获取客户增长数据失败')
        setData([])
        setChartData([])
      }
    } catch (err) {
      console.error('获取客户增长数据异常:', err)
      setError('获取客户增长数据失败')
      setData([])
      setChartData([])
    } finally {
      console.log('获取客户增长数据完成')
      setLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    // 直接调用fetchGrowthData获取数据
    fetchGrowthData()
  }, [])

  // 当时间范围变化时重新加载数据
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
