import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, Drawer, Card, message, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { queryStatsData } from '../../../api/track'

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
  const [dataSource, setDataSource] = useState<JSErrorItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchJsErrors()
  }, [])

  const fetchJsErrors = async () => {
    setLoading(true)
    try {
      // 直接查询所有错误，然后在前端过滤出 JS 错误
      const response = await queryStatsData({ type: 'error_list', page: 1, pageSize: 50 })

      if (response.code === 200 && response.data) {
        const { list } = response.data
        // 过滤出 JS 错误，同时考虑可能的类型映射
        const jsErrors = list.filter((item: any) => {
          const errorType = item.errorType?.toLowerCase()
          return errorType === 'js' || errorType === 'js错误'
        })
        // 处理后端返回的数据，转换为前端需要的格式
        const processedData = jsErrors.map((item: any) => {
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
            errorType: 'js_error',
            message: item.message || '',
            stack: item.stack || extra.stack || '',
            timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : '',
          }
        })
        setDataSource(processedData)
      }
    } catch (error) {
      console.error('获取 JS 错误数据失败:', error)
      message.error('获取 JS 错误数据失败')
    } finally {
      setLoading(false)
    }
  }
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
      <Spin spinning={loading} tip="加载中...">
        <Table rowKey="id" columns={columns} dataSource={dataSource} size="small" />
      </Spin>
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
