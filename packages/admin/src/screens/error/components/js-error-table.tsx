import React, { useState } from 'react'
import { Table, Button, Tag, Space, Drawer, Card } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface JSErrorItem {
  id: string
  errorType: 'js_error' | 'unhandled_rejection'
  message: string
  stack: string
  timestamp: string
}

const JsErrorTable = () => {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<JSErrorItem | null>(null)
  const dataSource: JSErrorItem[] = [
    {
      id: '1',
      errorType: 'js_error',
      message: "Uncaught ReferenceError: 'user' is not defined",
      stack: "ReferenceError: 'user' is not defined\n    at HTMLButtonElement.onclick...",
      timestamp: '2023-12-11 10:00:00',
    },
  ]
  const columns: ColumnsType<JSErrorItem> = [
    {
      title: '错误信息',
      dataIndex: 'message',
      ellipsis: true, // 文字太长自动省略
      render: (text) => <span style={{ color: '#cf1322' }}>{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'errorType',
      width: 120,
      render: (type) => (
        // 根据错误类型显示不同颜色的标签
        <Tag color={type === 'js_error' ? 'volcano' : 'orange'}>
          {type === 'js_error' ? 'JS' : 'Promise'}
        </Tag>
      ),
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
        // 点击详情按钮，打开侧边弹窗
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
      <Drawer open={visible} onClose={() => setVisible(false)} width={600} title="JS 错误详情">
        {current && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card type="inner" title="错误堆栈" size="small">
              <pre style={{ background: '#f5f5f5', padding: 10, overflow: 'auto', fontSize: 12 }}>
                {current.stack}
              </pre>
            </Card>
          </Space>
        )}
      </Drawer>
    </>
  )
}
export default JsErrorTable
