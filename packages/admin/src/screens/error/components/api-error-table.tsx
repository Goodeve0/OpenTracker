import React, { useState } from 'react'
import { Table, Button, Tag, Space, Drawer, Descriptions } from 'antd'
import type { ColumnsType } from 'antd/es/table'

// 1. 定义数据契约
interface ApiErrorItem {
  id: string
  url: string // 请求地址
  method: string // GET, POST, PUT 等
  status: number // 状态码: 200, 404, 500, 0(跨域/断网)
  duration: number // 耗时 (毫秒)
  requestBody: string // 发送了什么给后端
  responseBody: string // 后端返回了什么报错
  timestamp: string
}

const ApiErrorTable = () => {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<ApiErrorItem | null>(null)

  // 2. 模拟假数据
  const dataSource: ApiErrorItem[] = [
    {
      id: '1',
      url: '/api/v1/user/profile',
      method: 'POST',
      status: 500, // 服务器报错
      duration: 120, // 120ms
      requestBody: '{ "userId": 123 }',
      responseBody: '{ "error": "Internal Server Error", "code": 50001 }',
      timestamp: '2023-12-11 14:00:00',
    },
    {
      id: '2',
      url: 'https://google.com/api',
      method: 'GET',
      status: 0, // 0 通常代表跨域 (CORS) 或者网络断开了
      duration: 15,
      requestBody: '',
      responseBody: 'Network Error / CORS Blocked',
      timestamp: '2023-12-11 14:05:00',
    },
  ]

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
      <Table rowKey="id" columns={columns} dataSource={dataSource} size="small" />

      {/* 侧边详情 */}
      <Drawer open={visible} onClose={() => setVisible(false)} width={640} title="API 请求详情">
        {current && (
          // 这里用 Descriptions 组件，适合展示 key-value 格式的信息
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="请求 URL">{current.url}</Descriptions.Item>
            <Descriptions.Item label="状态码">
              {current.status === 0 ? '0 (跨域或网络故障)' : current.status}
            </Descriptions.Item>
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
