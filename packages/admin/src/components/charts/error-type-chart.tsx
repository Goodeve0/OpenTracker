import React, { useRef, useEffect, useState } from 'react'
import * as echarts from 'echarts'
import { Spin } from 'antd'
import { queryStatsData } from '../../api/track'

interface ErrorTypeChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const ErrorTypeChart: React.FC<ErrorTypeChartProps> = ({
  title = '错误类型分布',
  height = 300,
  loading = false,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const [data, setData] = useState<any[]>([])
  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 从后端API获取错误类型分布数据
  useEffect(() => {
    const fetchErrorTypeData = async () => {
      setError(null)
      setLocalLoading(true)
      try {
        const response = await queryStatsData({
          type: 'error_type_distribution',
        })

        if (response.code === 200 && response.data) {
          if (Array.isArray(response.data)) {
            setData(response.data)
          } else {
            setData([])
          }
        } else {
          setData([])
        }
      } catch (err) {
        setError('获取错误类型分布数据失败')
        console.error('获取错误类型分布数据失败:', err)
        setData([]) // 确保数据为空，触发"暂无数据"显示
      } finally {
        setLocalLoading(false)
      }
    }

    fetchErrorTypeData()
  }, [])

  // 更新图表数据
  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // 配置图表选项
    const option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '错误类型',
          type: 'pie',
          radius: '50%',
          label: { show: true, formatter: '{b}', fontSize: 12 },
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0,0,0,0.5)',
            },
          },
        },
      ],
    }

    chartInstance.current.setOption(option)

    // 添加延迟resize，确保容器大小已确定
    const resizeTimeout = setTimeout(() => {
      chartInstance.current?.resize()
    }, 100)

    // 监听窗口大小变化，自动调整图表大小
    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      chartInstance.current?.dispose()
    }
  }, [data])

  // 处理加载状态
  useEffect(() => {
    if (chartInstance.current) {
      if (loading) {
        chartInstance.current.showLoading()
      } else {
        chartInstance.current.hideLoading()
      }
    }
  }, [loading])

  if (loading || localLoading) {
    return (
      <div
        style={{
          height: `${height}px`,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin tip="加载中..." />
      </div>
    )
  }

  // 无论是否有错误，只要数据为空就显示"暂无数据"
  const isEmptyData = !data || data.length === 0

  return (
    <div style={{ height: `${height}px`, width: '100%', position: 'relative' }}>
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
      <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
    </div>
  )
}

export default ErrorTypeChart
