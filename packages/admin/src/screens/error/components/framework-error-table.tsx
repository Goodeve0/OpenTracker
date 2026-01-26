import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Drawer, Typography, message, Spin } from 'antd'
// 引入一个小图标，专门用来表示“代码/组件”
import { CodeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { queryStatsData } from '../../../api/track'

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
  const [dataSource, setDataSource] = useState<FrameworkErrorItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFrameworkErrors()
  }, [])

  const fetchFrameworkErrors = async () => {
    setLoading(true)
    try {
      const response = await queryStatsData({ type: 'framework_errors', page: 1, pageSize: 50 })
      if (response.code === 200 && response.data) {
        const { list } = response.data
        // 处理后端返回的数据，转换为前端需要的格式
        const processedData = list.map((item: any) => {
          let extra = {}
          try {
            if (item.extra && typeof item.extra === 'string') {
              extra = JSON.parse(item.extra)
            }
          } catch (e) {
            console.error('解析 extra 字段失败:', e)
          }

          return {
            id: item.id?.toString() || Math.random().toString(36).substr(2, 9),
            message: item.message || '',
            componentName: extra.componentName || 'Unknown',
            componentStack: extra.componentStack || '',
            stack: item.stack || extra.stack || '',
            timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : '',
          }
        })
        setDataSource(processedData)
      }
    } catch (error) {
      console.error('获取框架错误数据失败:', error)
      message.error('获取框架错误数据失败')
    } finally {
      setLoading(false)
    }
  }

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
      <Spin spinning={loading} tip="加载中...">
        <Table rowKey="id" columns={columns} dataSource={dataSource} size="small" />
      </Spin>

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
