import React, { useState, useEffect } from 'react'
import { Table, Spin, Typography, Space, Card, Row, Col } from 'antd'
import {
  EyeOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { behaviorAPI } from '../../api/behavior'
import type { ColumnType } from 'antd/es/table'

const { Title } = Typography

// 页面访问数据类型定义
interface PageVisitData {
  pageUrl: string
  pageViews: number
  uniqueVisitors: number
  bounceRate: string
  averageStayTime: string
  exitRate: string
  [key: string]: any
}

const BehaviorVisitedPages: React.FC = () => {
  const [data, setData] = useState<PageVisitData[]>([])
  const [loading, setLoading] = useState(false)

  // 从API获取数据
  const fetchPageVisits = async () => {
    setLoading(true)
    try {
      const response = await behaviorAPI.getPageVisits()
      if (response.code === 200) {
        setData(response.data)
      }
    } catch (error) {
      console.error('获取页面访问数据失败:', error)
      // 保持数据为空，不使用模拟数据
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPageVisits()
  }, [])

  // 表格列定义
  const columns: ColumnType<PageVisitData>[] = [
    {
      title: '页面网址',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      render: (text) => (
        <Space>
          <EyeOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '页面浏览量',
      dataIndex: 'pageViews',
      key: 'pageViews',
      sorter: (a, b) => a.pageViews - b.pageViews,
      render: (text) => text.toLocaleString(),
    },
    {
      title: '唯一访问量',
      dataIndex: 'uniqueVisitors',
      key: 'uniqueVisitors',
      sorter: (a, b) => a.uniqueVisitors - b.uniqueVisitors,
      render: (text) => (
        <Space>
          <UserOutlined />
          <span>{text.toLocaleString()}</span>
        </Space>
      ),
    },
    {
      title: '跳出率',
      dataIndex: 'bounceRate',
      key: 'bounceRate',
      sorter: (a, b) => parseFloat(a.bounceRate) - parseFloat(b.bounceRate),
      render: (text) => (
        <Space>
          <ExclamationCircleOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '平均停留时间',
      dataIndex: 'averageStayTime',
      key: 'averageStayTime',
      render: (text) => (
        <Space>
          <ClockCircleOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '退出率',
      dataIndex: 'exitRate',
      key: 'exitRate',
      sorter: (a, b) => parseFloat(a.exitRate) - parseFloat(b.exitRate),
      render: (text) => (
        <Space>
          <LogoutOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000e0' }}>访问页面分析</div>
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="pageUrl"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default BehaviorVisitedPages
