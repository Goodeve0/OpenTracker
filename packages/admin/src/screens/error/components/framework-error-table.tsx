import React, { useState } from 'react'
import { Table, Button, Tag, Space, Drawer, Typography } from 'antd'
// 引入一个小图标，专门用来表示“代码/组件”
import { CodeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

// 1. 定义数据契约
// 注意：这里比刚才多了 componentName 和 componentStack
interface FrameworkErrorItem {
  id: string
  message: string
  componentName: string // 【新增】报错的组件名字
  componentStack: string // 【新增】React 独特的组件路径
  stack: string // 原始的 JS 堆栈
  timestamp: string
}

const FrameworkErrorTable = () => {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState<FrameworkErrorItem | null>(null)

  // 2. 模拟假数据
  const dataSource: FrameworkErrorItem[] = [
    {
      id: '1',
      message: 'Error: Objects are not valid as a React child',
      componentName: 'UserInfo', // 假设是 UserInfo 组件坏了
      componentStack: '\n    in UserInfo (at App.tsx:24)\n    in div (at App.tsx:20)',
      stack: 'Error: Objects are not valid as a React child...',
      timestamp: '2023-12-11 14:20:00',
    },
  ]

  // 3. 表格列配置
  const columns: ColumnsType<FrameworkErrorItem> = [
    {
      title: '错误摘要',
      dataIndex: 'message',
      ellipsis: true,
      render: (text) => <span style={{ color: '#cf1322' }}>{text}</span>,
    },
    {
      title: '报错组件', // 【新增】这一列专门展示组件名
      dataIndex: 'componentName',
      width: 150,
      render: (text) => (
        // 加个紫色的小标签，看起来像代码
        <Tag color="purple" icon={<CodeOutlined />}>
          {text}
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
      {/* 表格主体 */}
      <Table rowKey="id" columns={columns} dataSource={dataSource} size="small" />

      {/* 侧边详情：这里和刚才不一样，这里有两块内容 */}
      <Drawer
        open={visible}
        onClose={() => setVisible(false)}
        width={700}
        title="React 组件错误详情"
      >
        {current && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* 第一块：展示组件堆栈（特有的） */}
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                组件渲染路径 (Component Stack)
              </div>
              {/* 用黄色背景强调这是 React 专属信息 */}
              <pre
                style={{
                  background: '#fff7e6',
                  border: '1px solid #ffd591',
                  padding: 10,
                  borderRadius: 4,
                  color: '#d46b08',
                  fontSize: 12,
                }}
              >
                {current.componentStack}
              </pre>
            </div>

            {/* 第二块：展示原始 JS 堆栈 */}
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>原始堆栈 (Error Stack)</div>
              <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, fontSize: 12 }}>
                {current.stack}
              </pre>
            </div>
          </Space>
        )}
      </Drawer>
    </>
  )
}

export default FrameworkErrorTable
