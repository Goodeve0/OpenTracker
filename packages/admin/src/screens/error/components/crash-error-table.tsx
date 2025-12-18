import React from 'react'
import { Table, Tag, Space } from 'antd'
// 引入闪电图标（代表崩溃）和时钟图标（代表存活时间）
import { ThunderboltOutlined, ClockCircleOutlined } from '@ant-design/icons'

// 1. 定义数据契约
interface CrashErrorItem {
  id: string
  pageUrl: string // 崩溃时所在的网址
  timestamp: string // 什么时候崩的
  duration: string // 页面存活了多久（核心指标）
  platform: string // 操作系统（Windows/Mac/Android等）
}

const CrashErrorTable = () => {
  // 2. 模拟假数据
  const dataSource: CrashErrorItem[] = [
    {
      id: '1',
      pageUrl: 'http://localhost:3000/big-data',
      timestamp: '2023-12-11 16:45:00',
      duration: '5m 20s', // 也就是用户打开页面5分20秒后崩了
      platform: 'Windows',
    },
  ]

  // 3. 表格列配置
  const columns = [
    {
      title: '状态',
      width: 100,
      render: () => (
        // 用红色的 Tag + 闪电图标，非常醒目
        <Tag color="#f50" icon={<ThunderboltOutlined />}>
          崩溃
        </Tag>
      ),
    },
    {
      title: '崩溃页面',
      dataIndex: 'pageUrl',
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '存活时长',
      dataIndex: 'duration',
      render: (text: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#faad14' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '设备',
      dataIndex: 'platform',
      width: 100,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      width: 180,
    },
  ]

  // 4. 返回布局
  // 崩溃记录通常比较简单，不需要点击详情弹窗，直接展示表格即可
  return <Table rowKey="id" columns={columns} dataSource={dataSource} size="small" />
}

export default CrashErrorTable
