/// <reference types="react" />
import React, { useRef, useEffect, useState } from 'react'
import * as echarts from 'echarts'
import {
  Layout,
  Row,
  Col,
  Card,
  Space,
  Button,
  DatePicker,
  Typography,
  Statistic,
  Tag,
  Table,
  Modal,
  Descriptions,
  message,
} from 'antd'
import {
  BugOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ErrorItem } from '../../types/error'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../types'
import { queryStatsData } from '../../api/track'
const { Content } = Layout
const { Text } = Typography

const ErrorOverview = () => {
  const trendChartRef = useRef(null)
  const pieChartRef = useRef(null)
  const barChartRef = useRef(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<ErrorItem | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [errorData, setErrorData] = useState<any[]>([])
  const [errorStats, setErrorStats] = useState({
    total: 0,
    userCount: 0,
    crashRate: 0,
    pendingIssues: 0,
  })

  const formatErrorType = (type: string) => {
    const map: Record<string, string> = {
      js: 'JS错误',
      api: 'API错误',
      cors: '跨域错误',
      framework: '框架错误',
      crash: '页面崩溃',
    }
    return map[type] || type
  }

  const columns = [
    {
      title: '错误摘要',
      dataIndex: 'message',
      key: 'message',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'errorType',
      key: 'errorType',
      render: (type) => {
        const formattedType = formatErrorType(type)
        let color = 'geekblue'
        if (formattedType === 'JS错误') color = 'volcano'
        if (formattedType === 'API错误') color = 'blue'
        if (formattedType === '跨域错误') color = 'green'
        if (formattedType === '框架错误') color = 'orange'
        if (formattedType === '页面崩溃') color = 'purple'
        return <Tag color={color}>{formattedType}</Tag>
      },
    },
    {
      title: '报错页面',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
    },
    {
      title: '最后发生时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          icon={status === 'Resolved' ? <CheckCircleOutlined /> : <WarningOutlined />}
          color={status === 'Resolved' ? 'success' : 'warning'}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a style={{ color: '#1890ff' }} onClick={() => showDetail(record)}>
            详情
          </a>
          <a>忽略</a>
        </Space>
      ),
    },
  ]

  const showDetail = (record: any) => {
    setCurrentDetail(record)
    setDrawerVisible(true)
  }

  const fetchErrorData = async (startTime?: number, endTime?: number) => {
    setIsLoading(true)
    try {
      // 如果没有提供时间范围，默认查询最近24小时
      const defaultStartTime = Date.now() - 24 * 60 * 60 * 1000
      const actualStartTime = startTime || defaultStartTime
      const actualEndTime = endTime || Date.now()

      // 并行请求多个统计数据
      const [errorTrends, errorTopN, highErrorPages, errorList] = await Promise.all([
        queryStatsData({
          type: 'error_trends',
          startTime: actualStartTime,
          endTime: actualEndTime,
        }),
        queryStatsData({
          type: 'error_top_n',
          startTime: actualStartTime,
          endTime: actualEndTime,
          limit: 5,
        }),
        queryStatsData({
          type: 'high_error_pages',
          startTime: actualStartTime,
          endTime: actualEndTime,
          limit: 5,
        }),
        queryStatsData({
          type: 'error_list',
          startTime: actualStartTime,
          endTime: actualEndTime,
          page: 1,
          pageSize: 50,
        }),
      ])

      // 处理错误列表数据
      if (errorList.code === 200 && errorList.data) {
        const { list, total } = errorList.data

        const processedList = list.map((item: any) => {
          try {
            if (item.extra && typeof item.extra === 'string') {
              item.extra = JSON.parse(item.extra)
            }
          } catch (e) {
            console.error('解析 extra 字段失败:', e)
          }
          return item
        })

        setErrorData(processedList)

        const userCount = new Set(processedList.map((item: any) => item.userAgent).filter(Boolean))
          .size
        const crashCount = processedList.filter((item: any) => {
          const formattedType = formatErrorType(item.errorType)
          return formattedType === '页面崩溃'
        }).length
        const crashRate = total > 0 ? (crashCount / total) * 100 : 0
        const pendingIssues = processedList.filter((item: any) => item.status !== 'Resolved').length

        setErrorStats({
          total,
          userCount,
          crashRate,
          pendingIssues,
        })
      }

      // 更新图表数据
      updateCharts(errorTrends, errorTopN, highErrorPages)
    } catch (error) {
      console.error('获取错误数据失败:', error)
      message.error('获取错误数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  interface SeriesItem {
    name: string
    type: string
    smooth: boolean
    data: number[]
    itemStyle: {
      color: string
    }
  }

  interface TrendData {
    dates: string[]
    series: SeriesItem[]
  }

  const updateCharts = (errorTrends: any, errorTopN: any, highErrorPages: any) => {
    const trendChart = trendChartInstance.current
    const pieChart = pieChartInstance.current
    const barChart = barChartInstance.current

    if (!trendChart || !pieChart || !barChart) return

    // 处理错误趋势数据
    let trendData: TrendData = {
      dates: [],
      series: [],
    }

    if (errorTrends.code === 200 && errorTrends.data) {
      trendData = errorTrends.data as TrendData
    }

    // 处理错误类型分布数据
    let pieData: { name: string; value: number }[] = []

    if (errorTopN.code === 200 && errorTopN.data) {
      // 确保数据格式符合 ECharts 饼图要求
      pieData = errorTopN.data
        .map((item: any) => {
          // 转换为 ECharts 饼图所需的格式 {name: string, value: number}
          if (item.name && item.count !== undefined) {
            return { name: item.name, value: item.count }
          }
          // 如果数据格式不符合要求，返回默认值
          return { name: '未知', value: 0 }
        })
        .filter((item: any) => item.value > 0)
    }

    // 处理高频报错页面数据
    let topPages: { name: string; count: number }[] = []

    if (highErrorPages.code === 200 && highErrorPages.data) {
      topPages = highErrorPages.data
    }

    // 更新趋势图
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: trendData.series.map((s) => s.name), top: '0%' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.dates,
        axisLabel: {
          interval: 2,
          rotate: 60,
          formatter: function (value: string) {
            return value.replace('T', '\n')
          },
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 500,
        interval: 100,
        axisLabel: {
          formatter: '{value}',
        },
      },
      series: trendData.series,
    })

    // 更新饼图
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '错误类型',
          type: 'pie',
          radius: '50%',
          label: { show: true, formatter: '{b}', fontSize: 12 },
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0,0,0,0.5)',
            },
          },
        },
      ],
    })

    // 更新柱状图
    barChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'value', boundaryGap: [0, 0.01] },
      yAxis: {
        type: 'category',
        data: topPages.map((item: any) => item.name),
        axisLabel: { interval: 0, width: 80, overflow: 'truncate' },
      },
      series: [
        {
          name: '报错次数',
          type: 'bar',
          data: topPages.map((item: any) => item.count),
          itemStyle: { color: '#597ef7' },
        },
      ],
    })
  }

  // 使用 useRef 存储 ECharts 实例，避免重复初始化
  const trendChartInstance = useRef<echarts.ECharts | null>(null)
  const pieChartInstance = useRef<echarts.ECharts | null>(null)
  const barChartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    const chartDom = trendChartRef.current
    const pieChartDom = pieChartRef.current
    const barChartDom = barChartRef.current

    // 确保容器存在
    if (!chartDom || !pieChartDom || !barChartDom) return

    // 清理之前的实例
    if (trendChartInstance.current) {
      trendChartInstance.current.dispose()
    }
    if (pieChartInstance.current) {
      pieChartInstance.current.dispose()
    }
    if (barChartInstance.current) {
      barChartInstance.current.dispose()
    }

    // 初始化新实例
    const trendChart = echarts.init(chartDom)
    const pieChart = echarts.init(pieChartDom)
    const barChart = echarts.init(barChartDom)

    // 存储实例到 useRef
    trendChartInstance.current = trendChart
    pieChartInstance.current = pieChart
    barChartInstance.current = barChart

    // 立即调整图表大小，确保使用正确的容器尺寸
    trendChart.resize()
    pieChart.resize()
    barChart.resize()

    // 使用与 updateCharts 函数中一致的配置，确保第一次渲染时不会溢出
    const emptyOption = {
      tooltip: { trigger: 'axis' },
      legend: { top: '0%' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
        axisLabel: {
          interval: 2,
          rotate: 60,
          formatter: function (value: string) {
            return value.replace('T', '\n')
          },
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 500,
        interval: 100,
        axisLabel: {
          formatter: '{value}',
        },
      },
      series: [],
    }

    trendChart.setOption(emptyOption)
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{ type: 'pie', data: [] }],
    })
    barChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: [] },
      series: [{ type: 'bar', data: [] }],
    })

    const handleResize = () => {
      trendChart.resize()
      pieChart.resize()
      barChart.resize()
    }

    window.addEventListener('resize', handleResize)

    // 延迟执行数据请求，确保容器大小已经完全计算好
    setTimeout(() => {
      fetchErrorData()
      // 数据加载后再次调整大小
      setTimeout(() => {
        trendChart.resize()
        pieChart.resize()
        barChart.resize()
      }, 100)
    }, 200)

    return () => {
      window.removeEventListener('resize', handleResize)
      trendChart.dispose()
      pieChart.dispose()
      barChart.dispose()
      trendChartInstance.current = null
      pieChartInstance.current = null
      barChartInstance.current = null
    }
  }, [])

  const handleRefresh = (dates?: any, dateStrings?: any[]) => {
    let startTime: number | undefined
    let endTime: number | undefined

    if (dates && Array.isArray(dates) && dates.length === 2) {
      startTime = dates[0].valueOf()
      endTime = dates[1].valueOf()
    }

    fetchErrorData(startTime, endTime)
  }

  const handleButtonClick = () => {
    handleRefresh()
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ display: 'flex' }}>
          {/* 头部区域 */}
          <Row justify="space-between" align="middle">
            <Col>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000e0' }}>全景概览</div>
            </Col>
            <Col>
              <Space>
                <DatePicker.RangePicker onChange={handleRefresh} />
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleButtonClick}
                  loading={isLoading}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>

          {/* 核心指标卡片区域 */}
          <Row gutter={16}>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title="今日错误总数"
                  value={errorStats.total}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<BugOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title="影响用户数 (UV)"
                  value={errorStats.userCount}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title="页面崩溃率"
                  value={errorStats.crashRate}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#faad14' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title="待修复 Issue"
                  value={errorStats.pendingIssues}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <ChartWithAdd
                chartType={ChartType.ERROR_TRENDS}
                title="错误趋势分析 (24h)"
                description="展示24小时内的错误变化趋势"
                category="错误分析"
                defaultSize="large"
              >
                <div
                  ref={trendChartRef}
                  style={{ height: '350px', width: '100%', overflow: 'hidden' }}
                ></div>
              </ChartWithAdd>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <ChartWithAdd
                chartType={ChartType.ERROR_TYPE}
                title="错误类型分布"
                description="展示各类错误的分布情况"
                category="错误分析"
                defaultSize="medium"
              >
                <div ref={pieChartRef} style={{ height: '300px', width: '100%' }}></div>
              </ChartWithAdd>
            </Col>
            <Col span={12}>
              <ChartWithAdd
                chartType={ChartType.HIGH_ERROR_PAGES}
                title="高频报错页面 Top 5"
                description="展示报错次数最多的前5个页面"
                category="错误分析"
                defaultSize="medium"
              >
                <div ref={barChartRef} style={{ height: '300px', width: '100%' }}></div>
              </ChartWithAdd>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Card title="最新错误列表" extra={<Button type="link">查看全部日志</Button>}>
                <Table
                  columns={columns}
                  dataSource={errorData}
                  pagination={{ pageSize: 5 }}
                  rowKey="id"
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </Content>
      <Modal
        title="错误情况分析"
        centered
        open={drawerVisible}
        onCancel={() => setDrawerVisible(false)}
        width={700}
        footer={null}
      >
        {currentDetail && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="基础信息" bordered column={1} size="small">
              <Descriptions.Item label="错误摘要">
                <Text type="danger">{currentDetail.message}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="错误类型">
                <Tag color="red">{currentDetail.errorType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发生时间">{currentDetail.timestamp}</Descriptions.Item>
              <Descriptions.Item label="报错页面">{currentDetail.url}</Descriptions.Item>
            </Descriptions>

            {/* 2. 设备环境 */}
            <Descriptions title="设备环境" bordered size="small" column={2}>
              <Descriptions.Item label="浏览器">{currentDetail.userAgent}</Descriptions.Item>
              <Descriptions.Item label="系统">未知</Descriptions.Item>
            </Descriptions>

            {/* 3. 错误堆栈 */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>错误堆栈 (Stack Trace)</div>
              <div
                style={{
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  overflowX: 'auto',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                <Text type="secondary" copyable={{ text: currentDetail.stack || '无堆栈信息' }}>
                  {currentDetail.stack || '无堆栈信息'}
                </Text>
              </div>
            </div>

            {/* 4. 底部操作按钮 */}
            <Row gutter={16}>
              <Col span={12}>
                <Button block>复制堆栈</Button>
              </Col>
              <Col span={12}>
                <Button type="primary" block>
                  创建 Jira 任务
                </Button>
              </Col>
            </Row>
          </Space>
        )}
      </Modal>
    </Layout>
  )
}

export default ErrorOverview
