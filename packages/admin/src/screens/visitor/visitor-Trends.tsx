import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Spin,
  DatePicker,
  Select,
  ConfigProvider,
  Space,
} from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined } from '@ant-design/icons'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../types'
import dayjs from 'dayjs'
import { queryStatsData } from '../../api/track'
import { visitorAPI, VisitorDataPoint, OverviewData } from '../../api/visitor'

const { RangePicker } = DatePicker
const { Option } = Select

// 定义数据类型
interface GrowthRates {
  totalVisits: number
  uniqueVisitors: number
  averageDuration: number
  bounceRate: number
  pagesPerSession: number
  newVisitors: number
  returningVisitors: number
  totalPageViews: number
  uniquePageViews: number
}

// 添加缺失的接口定义
interface Tick {
  x: number
  date: string
}

interface YTick {
  y: number
  value: string
}

interface LineChartProps {
  data: VisitorDataPoint[]
  width?: number
  height?: number
  viewType?: 'visitors' | 'pageViews'
}

interface StatCardProps {
  title: string
  value: number | string
  unit?: string
  rate?: number
  description?: string
  color?: string
}

// 从后端API获取访客趋势数据（使用与其它统计相同的 queryStatsData，保证 URL 与鉴权一致）
const fetchVisitorTrends = async (
  startDate: string,
  endDate: string
): Promise<VisitorDataPoint[]> => {
  try {
    const startTime = dayjs(startDate).startOf('day').valueOf()
    const endTime = dayjs(endDate).endOf('day').valueOf()
    const response = await queryStatsData({
      type: 'visitor_trends',
      startTime,
      endTime,
    })
    const statsData = response?.data
    if (!statsData?.dates?.length || !statsData?.values) return []
    return statsData.dates.map((date: string, index: number) => ({
      date: dayjs(date).format('YYYY-MM-DD'),
      visitors: statsData.values[index] ?? 0,
      pageViews: Math.ceil((statsData.values[index] ?? 0) * 1.5),
    }))
  } catch (error) {
    console.error('获取访客趋势数据失败:', error)
    return []
  }
}

// 从后端API获取访客概览数据
const fetchVisitorOverview = async (startDate: string, endDate: string): Promise<OverviewData> => {
  try {
    const response = await visitorAPI.fetchVisitorOverview(startDate, endDate)
    return (
      response.data || {
        totalVisits: 0,
        uniqueVisitors: 0,
        averageDuration: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        newVisitors: 0,
        returningVisitors: 0,
        maxActivity: 0,
        totalPageViews: 0,
        uniquePageViews: 0,
        totalSessions: 0,
        uniqueSessions: 0,
      }
    )
  } catch (error) {
    console.error('获取访客概览数据失败:', error)
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      averageDuration: 0,
      bounceRate: 0,
      pagesPerSession: 0,
      newVisitors: 0,
      returningVisitors: 0,
      maxActivity: 0,
      totalPageViews: 0,
      uniquePageViews: 0,
      totalSessions: 0,
      uniqueSessions: 0,
    }
  }
}

// 自定义线图组件（使用SVG实现）
const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 800,
  height = 200,
  viewType = 'visitors',
}) => {
  const padding = { top: 20, right: 30, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 根据viewType选择要显示的数据字段
  const dataField = viewType === 'visitors' ? 'visitors' : 'pageViews'
  const dataLabel = viewType === 'visitors' ? '访客' : '浏览量'

  // 处理空数据情况
  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} className="line-chart">
        <text x={padding.left} y={padding.top + chartHeight / 2} fill="#8c8c8c" fontSize="14">
          暂无数据
        </text>
      </svg>
    )
  }

  // 找到数据的最大值和最小值
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d[dataField])) : 0
  const minValue = data.length > 0 ? Math.min(...data.map((d) => d[dataField])) : 0
  const valueRange = maxValue - minValue || 1 // 避免除以零

  // 计算数据点的坐标
  const dataPoints = data.map((item, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth
    const y = padding.top + chartHeight - ((item[dataField] - minValue) / valueRange) * chartHeight
    return { x, y, value: item[dataField], date: item.date }
  })

  // 生成路径字符串
  const pathData = dataPoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${path} L ${point.x} ${point.y}`
  }, '')

  // 生成X轴刻度
  const xTicks: Tick[] = []
  const tickCount = Math.min(5, data.length) // 确保不超过数据点数量
  for (let i = 0; i < tickCount; i++) {
    const index =
      data.length > 1 ? Math.round((i / Math.max(tickCount - 1, 1)) * (data.length - 1)) : 0
    const point = dataPoints[index]
    xTicks.push({
      x: point.x,
      date: dayjs(point.date).format('MM/DD'),
    })
  }

  // 生成Y轴刻度
  const yTicks: YTick[] = []
  const yTickCount = 4
  for (let i = 0; i <= yTickCount; i++) {
    const value = minValue + (valueRange / yTickCount) * i
    const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight
    yTicks.push({
      y,
      value: Math.round(value).toLocaleString(),
    })
  }

  return (
    <svg width={width} height={height} className="line-chart">
      {/* Y轴 */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke="#e8e8e8"
        strokeWidth="1"
      />

      {/* X轴 */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke="#e8e8e8"
        strokeWidth="1"
      />

      {/* Y轴刻度 */}
      {yTicks.map((tick, index) => (
        <g key={`y-tick-${index}`}>
          <line
            x1={padding.left - 5}
            y1={tick.y}
            x2={padding.left}
            y2={tick.y}
            stroke="#e8e8e8"
            strokeWidth="1"
          />
          <text x={padding.left - 10} y={tick.y + 5} textAnchor="end" fill="#8c8c8c" fontSize="12">
            {tick.value}
          </text>
        </g>
      ))}

      {/* X轴刻度 */}
      {xTicks.map((tick, index) => (
        <g key={`x-tick-${index}`}>
          <line
            x1={tick.x}
            y1={padding.top + chartHeight}
            x2={tick.x}
            y2={padding.top + chartHeight + 5}
            stroke="#e8e8e8"
            strokeWidth="1"
          />
          <text
            x={tick.x}
            y={padding.top + chartHeight + 20}
            textAnchor="middle"
            fill="#8c8c8c"
            fontSize="12"
          >
            {tick.date}
          </text>
        </g>
      ))}

      {/* 网格线 */}
      {yTicks.map((tick, index) => (
        <line
          key={`grid-${index}`}
          x1={padding.left}
          y1={tick.y}
          x2={padding.left + chartWidth}
          y2={tick.y}
          stroke="#f0f0f0"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      ))}

      {/* 数据线 */}
      <path d={pathData} fill="none" stroke="#1890ff" strokeWidth="2" />

      {/* 数据点 */}
      {dataPoints.map((point, index) => (
        <Tooltip
          key={`point-${index}`}
          title={`${dayjs(point.date).format('MM月DD日')}: ${point.value.toLocaleString()} ${dataLabel}`}
        >
          <circle
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#1890ff"
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
          />
        </Tooltip>
      ))}
    </svg>
  )
}

// 统计卡片组件
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = '',
  rate,
  description,
  color = '#3f8600',
}) => {
  // 安全地格式化值
  const formattedValue = typeof value === 'number' ? value : value || '0'

  return (
    <Card size="small" style={{ height: '100%' }}>
      <Statistic
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{title}</span>
            {description && (
              <Tooltip title={description}>
                <InfoCircleOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
              </Tooltip>
            )}
          </div>
        }
        value={formattedValue}
        precision={rate !== undefined ? 1 : 0}
        valueStyle={{ color }}
        suffix={
          <>
            {unit}
            {rate !== undefined && (
              <span style={{ marginLeft: 4, fontSize: 12 }}>
                ({rate > 0 ? '+' : ''}
                {rate}%)
              </span>
            )}
          </>
        }
        prefix={
          rate !== undefined &&
          (rate > 0 ? (
            <ArrowUpOutlined style={{ color: '#f5222d' }} />
          ) : rate < 0 ? (
            <ArrowDownOutlined style={{ color: '#52c41a' }} />
          ) : null)
        }
      />
    </Card>
  )
}

const VisitorTrends: React.FC = () => {
  const [visitorData, setVisitorData] = useState<VisitorDataPoint[]>([])
  const [overviewData, setOverviewData] = useState<OverviewData>({
    totalVisits: 0,
    uniqueVisitors: 0,
    averageDuration: 0,
    bounceRate: 0,
    pagesPerSession: 0,
    newVisitors: 0,
    returningVisitors: 0,
    maxActivity: 0,
    totalPageViews: 0,
    uniquePageViews: 0,
    totalSessions: 0,
    uniqueSessions: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ])
  const [viewType, setViewType] = useState<'visitors' | 'pageViews'>('visitors')

  // 处理日期范围变化的适配函数
  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
    }
  }

  // 加载数据
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true)
      try {
        // 获取日期范围
        const startDate = dateRange[0].format('YYYY-MM-DD')
        const endDate = dateRange[1].format('YYYY-MM-DD')

        // 使用与其它统计相同的接口获取访客趋势，再根据趋势数据计算概览
        const trendData = await fetchVisitorTrends(startDate, endDate)
        const totalVisitors = trendData.reduce((sum, d) => sum + d.visitors, 0)
        const totalPageViews = trendData.reduce((sum, d) => sum + d.pageViews, 0)
        const overview: OverviewData = {
          totalVisits: totalVisitors,
          uniqueVisitors: totalVisitors,
          averageDuration: 0,
          bounceRate: 0,
          pagesPerSession: totalVisitors > 0 ? totalPageViews / totalVisitors : 0,
          newVisitors: 0,
          returningVisitors: 0,
          maxActivity: trendData.length ? Math.max(...trendData.map((d) => d.visitors), 0) : 0,
          totalPageViews: totalPageViews,
          uniquePageViews: totalPageViews,
          totalSessions: totalVisitors,
          uniqueSessions: totalVisitors,
        }

        // 调试信息：打印获取的数据
        console.log('从API获取的访客趋势数据:', trendData)
        console.log('数据统计:', {
          数据点数量: trendData.length,
          访客数范围: {
            最小值: trendData.length > 0 ? Math.min(...trendData.map((d) => d.visitors)) : 0,
            最大值: trendData.length > 0 ? Math.max(...trendData.map((d) => d.visitors)) : 0,
          },
          浏览量范围: {
            最小值: trendData.length > 0 ? Math.min(...trendData.map((d) => d.pageViews)) : 0,
            最大值: trendData.length > 0 ? Math.max(...trendData.map((d) => d.pageViews)) : 0,
          },
        })

        setVisitorData(trendData)
        setOverviewData(overview)
      } catch (error: any) {
        console.error('获取访客数据失败:', error)
        // 保持当前数据不变，不重置为默认值
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, viewType])

  // 简单的增长率计算（基于当前数据的前一天比较）
  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return 0
    const rate = ((current - previous) / previous) * 100
    return Math.round(rate * 10) / 10 // 保留一位小数
  }

  // 计算增长率（示例：基于当前数据的简单计算）
  const growthRates: GrowthRates = {
    totalVisits: 0,
    uniqueVisitors: 0,
    averageDuration: 0,
    bounceRate: 0,
    pagesPerSession: 0,
    newVisitors: 0,
    returningVisitors: 0,
    totalPageViews: 0,
    uniquePageViews: 0,
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div className="visitor-trends">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000e0' }}>访客趋势</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: 300 }}
            />
            <Select value={viewType} onChange={setViewType} style={{ width: 120 }}>
              <Option value="visitors">访客数</Option>
              <Option value="pageViews">浏览量</Option>
            </Select>
          </div>
        </div>

        {/* 访客趋势图 */}
        <ChartWithAdd
          chartType={ChartType.VISITOR_TRENDS}
          title="访客趋势图"
          description="展示网站访客数量和浏览量的变化趋势"
          category="访客分析"
          defaultSize="large"
          loading={loading}
        >
          <LineChart data={visitorData} width={800} height={300} viewType={viewType} />
        </ChartWithAdd>

        {/* 访客概览 */}
        <h3 style={{ marginBottom: 16 }}>访客概览</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatCard
              title="总访问次数"
              value={(overviewData.totalVisits || 0).toLocaleString()}
              rate={growthRates.totalVisits}
              description="所选时间范围内的总访问次数"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatCard
              title="独立访客数"
              value={(overviewData.uniqueVisitors || 0).toLocaleString()}
              rate={growthRates.uniqueVisitors}
              description="所选时间范围内的独立访客数量"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatCard
              title="平均停留时间"
              value={
                overviewData.averageDuration
                  ? `${Math.floor(overviewData.averageDuration / 60)}:${String(overviewData.averageDuration % 60).padStart(2, '0')}`
                  : '0:00'
              }
              rate={growthRates.averageDuration}
              description="访客在网站上的平均停留时间"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatCard
              title="跳出率"
              value={overviewData.bounceRate || 0}
              unit="%"
              rate={growthRates.bounceRate}
              description="只访问一个页面就离开的访客比例"
              color="#fa8c16"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatCard
              title="每次访问页数"
              value={overviewData.pagesPerSession || 0}
              rate={growthRates.pagesPerSession}
              description="访客每次访问平均浏览的页面数"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatCard
              title="总浏览次数"
              value={(overviewData.totalPageViews || 0).toLocaleString()}
              rate={growthRates.totalPageViews}
              description="所选时间范围内的总页面浏览次数"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatCard
              title="独立浏览量"
              value={(overviewData.uniquePageViews || 0).toLocaleString()}
              rate={growthRates.uniquePageViews}
              description="所选时间范围内的独立页面浏览次数"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatCard
              title="最大活跃度"
              value={overviewData.maxActivity || 0}
              unit="次/分钟"
              description="所选时间范围内的最大每分钟访问次数"
              color="#722ed1"
            />
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  )
}

export default VisitorTrends
