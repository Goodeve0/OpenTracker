import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Drawer, Descriptions, message, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { queryStatsData } from '../../../api/track'
import { ApiErrorItem } from '../../../types/error'

// 1. 定义数据契约

const ApiErrorTable = () => {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<ApiErrorItem | null>(null)
  const [dataSource, setDataSource] = useState<ApiErrorItem[]>([])
  const [loading, setLoading] = useState(false)

  // 2. 从后端获取数据
  useEffect(() => {
    fetchApiErrors()
  }, [])

  const fetchApiErrors = async () => {
    setLoading(true)
    try {
      // 直接查询所有错误，然后在前端过滤出 API 错误
      const response = await queryStatsData({ type: 'error_list', page: 1, pageSize: 50 })

      if (response.code === 200 && response.data) {
        const { list } = response.data
        // 过滤出 API 错误，同时考虑可能的类型映射
        const apiErrors = list.filter((item: any) => {
          const errorType = item.errorType?.toLowerCase()
          return errorType === 'api' || errorType === 'api错误' || errorType === '网络异常'
        })
        // 处理后端返回的数据，转换为前端需要的格式
        const processedData = apiErrors.map((item: any) => {
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
            url: extra.url || item.pageUrl || '',
            method: extra.method || 'GET',
            status: extra.status || 500,
            duration: extra.duration || 0,
            requestBody: extra.requestBody || '',
            responseBody: extra.responseBody || item.message || '',
            timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : '',
          }
        })
        setDataSource(processedData)
      }
    } catch (error) {
      console.error('获取 API 错误数据失败:', error)
      message.error('获取 API 错误数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 3. 表格列配置
  const columns: ColumnsType<ApiErrorItem> = [
    {
      title: '请求方法',
      dataIndex: 'method',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '请求地址',
      dataIndex: 'url',
      ellipsis: true,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '状态码',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        // 根据状态码显示不同颜色
        if (status === 200) return <Tag color="success">{status}</Tag>
        if (status === 500) return <Tag color="error">{status}</Tag>
        if (status === 0) return <Tag color="purple">跨域/断网</Tag>
        return <Tag color="warning">{status}</Tag>
      },
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      width: 100,
      render: (text) => `${text}ms`,
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      width: 180,
    },
    {
      title: '操作',
      width: 80,
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setCurrent(r)
            setVisible(true)
          }}
        >
          详情
        </Button>
      ),
    },
  ]

  return (
    <>
      <Spin spinning={loading} tip="加载中...">
        <Table rowKey="id" columns={columns} dataSource={dataSource} size="small" />
      </Spin>

      {/* 侧边详情 */}
      <Drawer open={visible} onClose={() => setVisible(false)} width={640} title="API 请求详情">
        {current && (
          // 这里用 Descriptions 组件，适合展示 key-value 格式的信息
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="请求 URL">{current.url}</Descriptions.Item>
            <Descriptions.Item label="请求方法">{current.method}</Descriptions.Item>
            <Descriptions.Item label="状态码">
              {current.status === 0 ? '0 (跨域或网络故障)' : current.status}
            </Descriptions.Item>
            <Descriptions.Item label="耗时">{current.duration}ms</Descriptions.Item>
            <Descriptions.Item label="发生时间">{current.timestamp}</Descriptions.Item>
            <Descriptions.Item label="请求参数 (Body)">
              <pre style={{ maxHeight: 150, overflow: 'auto', margin: 0 }}>
                {current.requestBody || '无'}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="响应内容 (Response)">
              <pre style={{ maxHeight: 300, overflow: 'auto', background: '#f5f5f5', margin: 0 }}>
                {current.responseBody}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  )
}

export default ApiErrorTable
