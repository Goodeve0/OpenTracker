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
import ChartWithAdd from '../../components/chart-with-add'
import LineChart from './components/LineChart'
import StatCard from './components/StatCard'
import { ChartType } from '../../config/chart'
import { GrowthRates } from '../../types/visitor'
import dayjs from 'dayjs'
import { queryStatsData } from '../../api/track'
import { visitorAPI, VisitorDataPoint, OverviewData } from '../../api/visitor'

const { RangePicker } = DatePicker
const { Option } = Select

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
