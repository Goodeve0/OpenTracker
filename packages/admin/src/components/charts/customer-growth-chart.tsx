import React, { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { Line } from '@ant-design/charts' // 恢复使用Ant Design Charts
import dayjs from 'dayjs'

// 从原页面复制的辅助函数
const generateDateArray = (days: number): string[] => {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    dates.push(date)
  }
  return dates
}

// 从原页面复制的获取行为数据的函数
const getBehaviorsFromLocalStorage = (): any[] => {
  try {
    const behaviors = localStorage.getItem('behaviors')
    return behaviors ? JSON.parse(behaviors) : []
  } catch (error) {
    console.error('从 localStorage 获取行为数据失败:', error)
    return []
  }
}

interface CustomerGrowthChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const CustomerGrowthChart: React.FC<CustomerGrowthChartProps> = ({
  title = '客户增长趋势',
  height = 300,
  loading = false,
}) => {
  const [data, setData] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // 从原页面复制的完整数据获取和处理逻辑
  useEffect(() => {
    const fetchGrowthData = async () => {
      setError(null)
      try {
        // 从 localStorage 获取行为数据 - 与原页面完全相同
        const behaviors = getBehaviorsFromLocalStorage()

        // 生成30天的日期数组 - 与原页面完全相同
        const days = 30
        const dates = generateDateArray(days)

        // 按日期分组统计行为数据 - 与原页面完全相同
        const groupedByDate: Record<string, any[]> = {}
        dates.forEach((date) => {
          groupedByDate[date] = []
        })

        behaviors.forEach((behavior: any) => {
          const date = dayjs(behavior.timestamp).format('YYYY-MM-DD')
          if (groupedByDate[date]) {
            groupedByDate[date].push(behavior)
          }
        })

        // 计算增长数据 - 与原页面完全相同
        let totalUsers = 0
        const growthData = dates.map((date) => {
          // 使用行为数据数量作为活跃用户数 - 与原页面完全相同
          const activeUsers = groupedByDate[date].length
          // 简化处理，使用活跃用户数作为新增用户数 - 与原页面完全相同
          const newUsers = activeUsers
          // 累计用户数 - 与原页面完全相同
          totalUsers += newUsers

          return {
            date,
            newUsers,
            activeUsers,
            totalUsers,
          }
        })

        setData(growthData)

        // 转换数据格式以适应@ant-design/plots Line组件，使用中文图例 - 与原页面完全相同
        const convertedChartData = growthData.flatMap((item) => [
          { date: item.date, type: '新增用户', value: item.newUsers },
          { date: item.date, type: '活跃用户', value: item.activeUsers },
          { date: item.date, type: '累计用户', value: item.totalUsers },
        ])

        setChartData(convertedChartData)
      } catch (err) {
        setError('获取客户增长数据失败')
        console.error('获取客户增长数据失败:', err)
      }
    }

    fetchGrowthData()
  }, [])

  if (loading) {
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

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff4d4f',
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <Line
        data={chartData}
        // 恢复与获客分析页面完全相同的配置
        xField="date"
        yField="value"
        seriesField="type"
        smooth
        series={[
          {
            name: '新增用户',
            style: {
              line: {
                stroke: '#1890ff',
                lineWidth: 2,
              },
              point: {
                fill: '#1890ff',
              },
            },
          },
          {
            name: '活跃用户',
            style: {
              line: {
                stroke: '#52c41a',
                lineWidth: 2,
              },
              point: {
                fill: '#52c41a',
              },
            },
          },
          {
            name: '累计用户',
            style: {
              line: {
                stroke: '#ff7875',
                lineWidth: 2,
              },
              point: {
                fill: '#ff7875',
              },
            },
          },
        ]}
        label={{ style: { fill: '#aaa' } }}
        tooltip={{ formatter: (datum: any) => `${datum.date}: ${datum.value}` }}
        legend={{ position: 'top' }}
        // 只修改xAxis的label配置，实现日期标签旋转
        xAxis={{
          label: {
            autoHide: true,
            autoRotate: true,
            rotate: 90, // 关键：设置标签旋转90度
            style: {
              fontSize: 12,
            },
            margin: 15,
          },
        }}
        yAxis={{ label: { formatter: (v: number) => v.toLocaleString() } }}
        point={{ size: 4, shape: 'circle' }}
        activePoint={{ size: 6 }}
      />
    </div>
  )
}

export default CustomerGrowthChart
