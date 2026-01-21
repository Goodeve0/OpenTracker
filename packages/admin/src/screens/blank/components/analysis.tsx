import React, { useState } from 'react'
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
} from 'antd'
import { RedoOutlined } from '@ant-design/icons'
import BlankDetail from './blank-details'
import ChartWithAdd from '../../../components/chart-with-add'
import { ChartType } from '../../../types'

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

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: 'NEW', value: 'NEW' },
  { label: 'OPEN', value: 'OPEN' },
  { label: 'FIXED', value: 'FIXED' },
  { label: 'CLOSED', value: 'CLOSED' },
]

const listData: BlankListItem[] = [
  {
    key: '1',
    page: '/admin/1',
    blankCounts: 16,
    users: 1,
    time: '2024-12-17 18:02:14',
    state: 'NEW',
    option: '操作',
  },
  {
    key: '2',
    page: '/admin/2',
    blankCounts: 10,
    users: 1,
    time: '2024-12-19 10:20:57',
    state: 'NEW',
    option: '操作',
  },
  {
    key: '3',
    page: '/admin/3',
    blankCounts: 9,
    users: 1,
    time: '2024-12-19 11:08:29',
    state: 'NEW',
    option: '操作',
  },
  {
    key: '4',
    page: '/admin/4',
    blankCounts: 8,
    users: 1,
    time: '2024-12-20 10:28:56',
    state: 'NEW',
    option: '操作',
  },
  {
    key: '5',
    page: '/admin/5',
    blankCounts: 8,
    users: 1,
    time: '2024-12-20 11:18:53',
    state: 'NEW',
    option: '操作',
  },
  {
    key: '6',
    page: '/admin/6',
    blankCounts: 4,
    users: 1,
    time: '2024-12-18 18:18:54',
    state: 'NEW',
    option: '操作',
  },
  {
    key: '7',
    page: '/admin/7',
    blankCounts: 2,
    users: 1,
    time: '2024-12-17 11:12:19',
    state: 'NEW',
    option: '操作',
  },
]

const xData = [
  '2025/12/14',
  '2025/12/15',
  '2025/12/16',
  '2025/12/17',
  '2025/12/18',
  '2025/12/19',
  '2025/12/20',
]

// 静态数据
const whiteScreenCount = [0, 5, 12, 16, 4, 10, 18]
const affectedUserCount = [0, 1, 3, 2, 1, 2, 3]
const whiteScreenRate = [0, 0.2, 0.45, 0.67, 0.25, 0.6, 1.2]
const affectedUserRate = [0, 1.1, 0.9, 0.52, 0.3, 0.7, 1.15]

const convertDecimalToPercent = (decimal: number) => {
  if (typeof decimal !== 'number' || isNaN(decimal)) {
    return '0.00%'
  }
  return (decimal * 100).toFixed(2) + '%'
}

const getChartOption = () => {
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

const handleChange = (value: string) => {
  console.log(`selected ${value}`)
}

const BlankOverview: React.FC = () => {
  const [isShowDetail, setIsShowDetail] = useState(false)

  const showDetail = () => {
    setIsShowDetail(true)
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
                <DatePicker.RangePicker />
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
              <Button icon={<RedoOutlined />} />
            </Space>
            <div style={{ paddingTop: 24 }}>
              <Table
                columns={columns}
                dataSource={listData}
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
