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
const { Content } = Layout
const { Text } = Typography

const ErrorOverview = () => {
  const trendChartRef = useRef(null)
  const pieChartRef = useRef(null)
  const barChartRef = useRef(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<ErrorItem | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const formatErrorType = (type: string) => {
    const map: Record<string, string> = {
      js: 'JS Error',
      api: 'API Error',
      cors: '跨域错误',
      resource: '资源错误',
      framework: '框架错误',
      behavior: '行为异常',
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
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'geekblue'
        if (type === 'JS Error') color = 'volcano'
        if (type === 'API Error') color = 'blue'
        return <Tag color={color}>{type}</Tag>
      },
    },
    {
      title: '报错页面',
      dataIndex: 'page',
      key: 'page',
    },
    {
      title: '最后发生时间',
      dataIndex: 'time',
      key: 'time',
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

  const dataSource: ErrorItem[] = [
    {
      id: '1',
      message: "Uncaught TypeError: Cannot read property 'id' of undefined",
      type: 'js',
      url: '/product/detail/1024',
      timestamp: '2023-10-27 10:24:00',
      status: 'unresolved',
      userAgent: 'Mozilla/5.0...',
    },
    {
      id: '2',
      message: '502 Bad Gateway: /api/v1/user/profile',
      type: 'api',
      url: '/user/center',
      timestamp: '2023-10-27 10:22:15',
      status: 'unresolved',
      userAgent: 'Mozilla/5.0...',
    },
    {
      id: '3',
      message: 'ChunkLoadError: Loading chunk 5 failed',
      type: 'resource',
      url: '/home',
      timestamp: '2023-10-27 09:15:00',
      status: 'resolved',
      userAgent: 'Mozilla/5.0...',
    },
    {
      id: '4',
      message: 'Vue warn: Property "visible" was accessed during render',
      type: 'framework',
      url: '/settings',
      timestamp: '2023-10-27 08:30:00',
      status: 'unresolved',
      userAgent: 'Mozilla/5.0...',
    },
    {
      id: '5',
      message: 'Network Error: timeout of 5000ms exceeded',
      type: 'api',
      url: '/payment',
      timestamp: '2023-10-26 23:10:00',
      status: 'unresolved',
      userAgent: 'Mozilla/5.0...',
    },
  ]
  const showDetail = (record: any) => {
    setCurrentDetail(record)
    setDrawerVisible(true)
  }
  useEffect(() => {
    const chartDom = trendChartRef.current
    const trendChart = echarts.init(chartDom)
    const pieChart = echarts.init(pieChartRef.current)
    const barChart = echarts.init(barChartRef.current)
    const trendOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['JS错误', 'API错误', '资源错误', '框架错误', '页面崩溃'], top: '0%' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:00'],
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'JS错误',
          type: 'line',
          smooth: true,
          data: [120, 132, 101, 134, 90, 230, 210],
          itemStyle: { color: '#cf1322' },
        },
        {
          name: 'API错误',
          type: 'line',
          smooth: true,
          data: [220, 182, 191, 234, 290, 330, 310],
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '资源错误',
          type: 'line',
          smooth: true,
          data: [150, 232, 201, 154, 190, 330, 410],
          itemStyle: { color: '#faad14' },
        },
        {
          name: '框架错误',
          type: 'line',
          smooth: true,
          data: [30, 42, 21, 54, 60, 80, 40],
          itemStyle: { color: '#722ed1' },
        },
        {
          name: '页面崩溃',
          type: 'line',
          smooth: true,
          data: [2, 5, 1, 8, 3, 0, 2],
          itemStyle: { color: '#eb2f96' },
        },
      ],
    }
    const pieOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          names: '错误类型',
          type: 'pie',
          radius: '50%',
          label: { show: true, formatter: '{b}', fontSize: 12 },
          data: [
            { value: 1048, name: 'JS错误' },
            { value: 735, name: 'API错误' },
            { value: 580, name: '资源错误' },
            { value: 484, name: '框架错误' },
            { value: 300, name: '页面崩溃' },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0,0,0,0.5)',
            },
          },
        },
      ],
    }
    const barOption = {
      tooltip: { trigger: 'axios', axiosPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'value', boundaryGap: [0, 0.01] },
      yAxis: {
        type: 'category',
        data: ['/home', '/login', '/product/detail', '/cart', '/payment'],
        axisLabel: { interval: 0, width: 80, overflow: 'truncate' },
      },
      series: [
        {
          name: '报错次数',
          type: 'bar',
          data: [18203, 23489, 29034, 104970, 131744],
          itemStyle: { color: '#597ef7' }, // 柱子颜色
        },
      ],
    }
    trendChart.setOption(trendOption)
    pieChart.setOption(pieOption)
    barChart.setOption(barOption)
    const handleResize = () => {
      trendChart.resize()
      pieChart.resize()
      barChart.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      trendChart.dispose()
      pieChart.dispose()
      barChart.dispose()
    }
  }, [])
  const handleRefresh = () => {
    setIsLoading(true)
    // 加上 as HTMLDivElement
    const trendChart = echarts.getInstanceByDom(trendChartRef.current as unknown as HTMLDivElement)
    const pieChart = echarts.getInstanceByDom(pieChartRef.current as unknown as HTMLDivElement)
    const barChart = echarts.getInstanceByDom(barChartRef.current as unknown as HTMLDivElement)
    trendChart?.showLoading()
    pieChart?.showLoading()
    barChart?.showLoading()
    setTimeout(() => {
      // --- A. 生成随机数据 (模拟后端返回) ---
      const randomData = Array.from({ length: 7 }, () => Math.floor(Math.random() * 500))
      const randomPieData = [
        { value: Math.floor(Math.random() * 1000), name: 'JS错误' },
        { value: Math.floor(Math.random() * 1000), name: 'API错误' },
        { value: Math.floor(Math.random() * 500), name: '资源错误' },
        { value: Math.floor(Math.random() * 500), name: '框架错误' },
        { value: Math.floor(Math.random() * 200), name: '页面崩溃' },
      ]

      // --- B. 更新图表数据 (setOption 会自动合并数据，只需传入变化的部分) ---
      trendChart?.setOption({
        series: [{ data: randomData }], // 只更新第一条线的数，这里偷懒演示一下
      })

      pieChart?.setOption({
        series: [{ data: randomPieData }],
      })

      // 柱状图也随机一下
      barChart?.setOption({
        series: [{ data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 100000)) }],
      })
      trendChart?.resize()
      pieChart?.resize()
      barChart?.resize()
      // 5. 关闭 Loading
      trendChart?.hideLoading()
      pieChart?.hideLoading()
      barChart?.hideLoading()

      setIsLoading(false)

      // 6. 弹出成功提示
      message.success('数据已更新到最新状态')
    }, 1500)
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
                  onClick={handleRefresh}
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
                  value={1024}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<BugOutlined />}
                  suffix={
                    <span style={{ fontSize: '12px', color: '#999', marginLeft: '4px' }}>+15%</span>
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title="影响用户数 (UV)"
                  value={342}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title="页面崩溃率"
                  value={0.12}
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
                  value={15}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Card title="错误趋势分析 (24h)">
                <div ref={trendChartRef} style={{ height: '350px', width: '100%' }}></div>
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Card title="错误类型分布">
                <div ref={pieChartRef} style={{ height: '300px', width: '100%' }}></div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="高频报错页面 Top 5">
                <div ref={barChartRef} style={{ height: '300px', width: '100%' }}></div>
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Card title="最新错误列表" extra={<Button type="link">查看全部日志</Button>}>
                <Table columns={columns} dataSource={dataSource} pagination={{ pageSize: 5 }} />
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
                <Tag color="red">{currentDetail.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发生时间">{currentDetail.timestamp}</Descriptions.Item>
              <Descriptions.Item label="报错页面">{currentDetail.url}</Descriptions.Item>
            </Descriptions>

            {/* 2. 设备环境 */}
            <Descriptions title="设备环境" bordered size="small" column={2}>
              <Descriptions.Item label="浏览器">Chrome 118.0</Descriptions.Item>
              <Descriptions.Item label="系统">Windows 10</Descriptions.Item>
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
                <Text
                  type="secondary"
                  copyable={{ text: "TypeError: Cannot read property 'id'..." }}
                >
                  TypeError: Cannot read property 'id' of undefined
                  <br />
                  &nbsp;&nbsp;at handleButtonClick (main.js:1234:25)
                  <br />
                  &nbsp;&nbsp;at HTMLUnknownElement.callCallback (vendors.js:4567:14)
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
