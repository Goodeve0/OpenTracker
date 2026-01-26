import React, { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { Pie } from '@ant-design/charts'
import { queryStatsData } from '../../api/track'

interface CustomerSourceChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const CustomerSourceChart: React.FC<CustomerSourceChartProps> = ({
  title = '客户来源分析',
  height = 300,
  loading = false,
}) => {
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [localLoading, setLocalLoading] = useState(false)

  // 从后端API获取客户来源数据
  useEffect(() => {
    const fetchSourceData = async () => {
      setError(null)
      setLocalLoading(true)
      try {
        // 调用后端API获取客户来源数据
        const response = await queryStatsData({
          type: 'customer_source',
        })

        if (response.code === 200 && response.data) {
          let sourceData: any[] = []

          if (Array.isArray(response.data)) {
            // 直接使用数组格式数据
            sourceData = response.data
          } else if (response.data.sources && response.data.values) {
            // 处理后端返回的sources和values格式
            sourceData = response.data.sources.map((source: string, index: number) => ({
              name: source,
              value: response.data.values[index] || 0,
            }))
          }

          // 转换为用户友好的来源名称
          const sourceMapping: Record<string, string> = {
            behavior: '直接访问',
            page_view: '页面访问',
            click: '点击事件',
            scroll: '滚动事件',
            search: '搜索事件',
            direct: '直接访问',
            default: '其他来源',
          }

          // 格式化数据
          const formattedData = sourceData.map((item) => ({
            name: sourceMapping[item.name] || item.name || '其他来源',
            value: item.value,
          }))

          setData(formattedData)
        }
      } catch (err) {
        setError('获取客户来源数据失败')
        console.error('获取客户来源数据失败:', err)
        setData([]) // 确保数据为空，触发"暂无数据"显示
      } finally {
        setLocalLoading(false)
      }
    }

    fetchSourceData()
  }, [])

  if (loading || localLoading) {
    return (
      <div
        style={{
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin />
      </div>
    )
  }

  // 无论是否有错误，只要数据为空就显示"暂无数据"
  const isEmptyData = !data || data.length === 0

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      {isEmptyData && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            zIndex: 1,
          }}
        >
          <div style={{ color: '#8c8c8c', fontSize: '14px' }}>暂无数据</div>
        </div>
      )}
      <Pie
        data={data}
        angleField="value"
        colorField="name"
        color={['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96']}
        label={{
          visible: true,
          formatter: (datum: any) => {
            if (!datum || typeof datum.value !== 'number') {
              return ''
            }
            return `${datum.value.toFixed(2)}%`
          },
        }}
        tooltip={{
          formatter: (datum: any) => {
            if (!datum || typeof datum.value !== 'number') {
              return ''
            }
            return `${datum.name}: ${datum.value.toFixed(2)}%`
          },
        }}
      />
    </div>
  )
}

export default CustomerSourceChart
