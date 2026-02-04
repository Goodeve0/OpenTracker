import React, { useState, useEffect } from 'react'
import ReactEcharts from 'echarts-for-react'
import {
  Card,
  Space,
  Typography,
  Select,
  Button,
  TableColumnsType,
  Table,
  Tag,
  Layout,
  Modal,
  DatePicker,
  Row,
  Col,
  message,
} from 'antd'
import { RedoOutlined } from '@ant-design/icons'
import BlankDetail from './blank-details'
import ChartWithAdd from '../../../components/chart-with-add'
import { ChartType } from '../../../config/chart'
import { queryBlankData, queryStatsData } from '../../../api/track'
import dayjs from 'dayjs'

const { Title } = Typography
const { Content } = Layout

interface BlankListItem {
  key: string
  page: string
  blankCounts: number
  users: number
  time: string
  state: 'NEW' | 'OPEN' | 'FIXED' | 'CLOSE'
  option: string
}

interface WhiteScreenTrendData {
  date: string
  whiteScreenCount: number
  affectedUserCount: number
  whiteScreenRate: number
  affectedUserRate: number
}

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: 'NEW', value: 'NEW' },
  { label: 'OPEN', value: 'OPEN' },
  { label: 'FIXED', value: 'FIXED' },
  { label: 'CLOSED', value: 'CLOSED' },
]

const convertDecimalToPercent = (decimal: number) => {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    return '0.00%'
  }
  return (decimal * 100).toFixed(2) + '%'
}

const handleChange = (value: string) => {
  console.log(`selected ${value}`)
}

const BlankOverview: React.FC = () => {
  const [isShowDetail, setIsShowDetail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [blankList, setBlankList] = useState<BlankListItem[]>([])
  const [trendData, setTrendData] = useState<WhiteScreenTrendData[]>([])
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs('2025-12-14'),
    dayjs('2025-12-20'),
  ])

  const showDetail = () => {
    setIsShowDetail(true)
  }

  const fetchWhiteScreenData = async () => {
    setLoading(true)
    try {
      // 获取白屏趋势数据
      const statsResponse = await queryStatsData({
        type: 'white_screen_trends',
        startTime: dateRange[0].startOf('day').valueOf(),
        endTime: dateRange[1].endOf('day').valueOf(),
        limit: 7,
      })

      if (statsResponse.code === 200 && statsResponse.data) {
        // 处理后端返回的数据格式
        if (statsResponse.data.dates && statsResponse.data.values) {
          const trends = statsResponse.data.dates.map((date: string, index: number) => ({
            date: dayjs(date).format('YYYY/MM/DD'),
            whiteScreenCount: statsResponse.data.values[index] || 0,
            affectedUserCount: Math.ceil(statsResponse.data.values[index] * 0.3) || 0, // 模拟用户数
            whiteScreenRate: (statsResponse.data.values[index] / 100).toFixed(2) || 0, // 模拟白屏率
            affectedUserRate: (statsResponse.data.values[index] / 200).toFixed(2) || 0, // 模拟影响用户率
          }))
          setTrendData(trends)
        } else {
          // 兼容其他数据格式
          const trends = statsResponse.data.map((item: any) => ({
            date: dayjs(item.timestamp || item.date).format('YYYY/MM/DD'),
            whiteScreenCount: item.blankCount || item.value || 0,
            affectedUserCount:
              item.userCount || Math.ceil((item.blankCount || item.value || 0) * 0.3) || 0,
            whiteScreenRate: item.blankRate || (item.blankCount || item.value || 0) / 100 || 0,
            affectedUserRate: item.userRate || (item.blankCount || item.value || 0) / 200 || 0,
          }))
          setTrendData(trends)
        }
      }

      // 获取白屏列表数据
      const listResponse = await queryBlankData({
        startTime: dateRange[0].startOf('day').valueOf(),
        endTime: dateRange[1].endOf('day').valueOf(),
        page: 1,
        pageSize: 20,
      })

      if (listResponse.code === 200 && listResponse.data?.list) {
        const list = listResponse.data.list.map((item: any, index: number) => ({
          key: (index + 1).toString(),
          page: item.pageUrl || '',
          blankCounts: 1, // 每条记录代表一次白屏
          users: 1,
          time: dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          state: 'NEW' as const,
          option: '操作',
        }))
        setBlankList(list)
      }
    } catch (error) {
      console.error('获取白屏数据失败:', error)
      message.error('获取白屏数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWhiteScreenData()
  }, [dateRange])

  const handleDateChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
    }
  }

  const handleRefresh = () => {
    fetchWhiteScreenData()
  }

  const getChartOption = () => {
    const xData = trendData.map((item) => item.date)
    const whiteScreenCount = trendData.map((item) => item.whiteScreenCount)
    const affectedUserCount = trendData.map((item) => item.affectedUserCount)
    const whiteScreenRate = trendData.map((item) => item.whiteScreenRate)
    const affectedUserRate = trendData.map((item) => item.affectedUserRate)

    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: number, series: any): string | number => {
          const seriesName: string = String(series?.name || '')
          if (seriesName.includes('率')) {
            return convertDecimalToPercent(value)
          }
          return typeof value === 'number' && !isNaN(value) ? value : 0
        },
      },
      legend: {
        data: ['白屏数', '影响用户数', '白屏率', '影响用户率'],
        bottom: 10,
      },
      grid: {
        left: '4%',
        right: '6%',
        bottom: 60,
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xData,
      },
      yAxis: [
        {
          type: 'value',
          name: '',
          position: 'left',
        },
        {
          type: 'value',
          name: '',
          position: 'right',
          axisLabel: {
            formatter: '{value} %',
          },
        },
      ],
      series: [
        {
          name: '白屏数',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#2d8cf0',
          },
          data: whiteScreenCount,
        },
        {
          name: '影响用户数',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#7c4dff',
          },
          data: affectedUserCount,
        },
        {
          name: '白屏率',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#00b894',
          },
          data: whiteScreenRate,
        },
        {
          name: '影响用户率',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#ff7675',
          },
          data: affectedUserRate,
        },
      ],
    }
  }

  const columns: TableColumnsType<BlankListItem> = [
    {
      title: '页面',
      dataIndex: 'page',
      ellipsis: true,
    },
    {
      title: '白屏数',
      dataIndex: 'blankCounts',
      sorter: (a, b) => a.blankCounts - b.blankCounts,
      defaultSortOrder: 'descend',
    },
    {
      title: '影响用户数',
      dataIndex: 'users',
      sorter: (a, b) => a.users - b.users,
    },
    {
      title: '最近发生时间',
      dataIndex: 'time',
      sorter: (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    },
    {
      title: '问题状态',
      dataIndex: 'state',
      render: (state) => (
        <Tag key={state} color="red">
          {state}
        </Tag>
      ),
    },
    {
      title: '操作',
      dataIndex: 'option',
      render: () => <Button onClick={() => showDetail()}>查看详情</Button>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ display: 'flex' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000e0' }}>白屏分析</div>
            </Col>
            <Col>
              <Space>
                <DatePicker.RangePicker value={dateRange} onChange={handleDateChange} />
                <Button icon={<RedoOutlined />} loading={loading} onClick={handleRefresh} />
              </Space>
            </Col>
          </Row>
          <ChartWithAdd
            chartType={ChartType.WHITE_SCREEN_TRENDS}
            title="白屏趋势分析"
            description="展示白屏问题的发生趋势"
            category="白屏监控"
            defaultSize="large"
          >
            <div style={{ width: '100%', height: 420 }}>
              <ReactEcharts option={getChartOption()} style={{ width: '100%', height: '100%' }} />
            </div>
          </ChartWithAdd>
          <Card>
            <Title level={5}>白屏列表</Title>
            <Space>
              <Space.Compact>
                <Button disabled>状态</Button>
                <Select
                  placeholder="请选择状态"
                  style={{ width: 120 }}
                  onChange={handleChange}
                  options={statusOptions}
                />
              </Space.Compact>
              <Button icon={<RedoOutlined />} loading={loading} onClick={handleRefresh} />
            </Space>
            <div style={{ paddingTop: 24 }}>
              <Table
                columns={columns}
                dataSource={blankList}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            </div>
          </Card>
        </Space>
      </Content>
      <Modal
        title="基本信息"
        centered
        open={isShowDetail}
        onCancel={() => setIsShowDetail(false)}
        width={700}
        footer={null}
      >
        <BlankDetail />
      </Modal>
    </Layout>
  )
}

export default BlankOverview
