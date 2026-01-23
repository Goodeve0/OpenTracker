import React, { useState, useEffect } from 'react'
import { Table, Tag, Space, message, Spin } from 'antd'
// 引入闪电图标（代表崩溃）和时钟图标（代表存活时间）
import { ThunderboltOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { queryStatsData } from '../../../api/track'

// 1. 定义数据契约
interface CrashErrorItem {
  id: string
  pageUrl: string // 崩溃时所在的网址
  timestamp: string // 什么时候崩的
  duration: string // 页面存活了多久（核心指标）
  platform: string // 操作系统（Windows/Mac/Android等）
}

const CrashErrorTable = () => {
  const [dataSource, setDataSource] = useState<CrashErrorItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCrashErrors()
  }, [])

  const fetchCrashErrors = async () => {
    setLoading(true)
    try {
      const response = await queryStatsData({ type: 'crash_errors', page: 1, pageSize: 50 })
      if (response.code === 200 && response.data) {
        const { list } = response.data
        // 处理后端返回的数据，转换为前端需要的格式
        const processedData = list.map((item: any) => {
          let extra: any = {}
          try {
            if (item.extra && typeof item.extra === 'string') {
              extra = JSON.parse(item.extra)
            }
          } catch (e) {
            console.error('解析 extra 字段失败:', e)
          }

          return {
            id: item.id?.toString() || Math.random().toString(36).substr(2, 9),
            pageUrl: item.pageUrl || '',
            timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : '',
            duration: extra.duration || '0s',
            platform: extra.platform || 'Unknown',
          }
        })
        setDataSource(processedData)
      }
    } catch (error) {
      console.error('获取崩溃错误数据失败:', error)
      message.error('获取崩溃错误数据失败')
    } finally {
      setLoading(false)
    }
  }

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
  return (
    <Spin spinning={loading} tip="加载中...">
      <Table rowKey="id" columns={columns} dataSource={dataSource} size="small" />
    </Spin>
  )
}

export default CrashErrorTable
