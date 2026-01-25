import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import { Card } from 'antd'

interface VisitorTrendsChartProps {
  title?: string
  height?: number
  data?: {
    dates?: string[]
    values?: number[]
  }
}

const VisitorTrendsChart: React.FC<VisitorTrendsChartProps> = ({
  title = '访客趋势',
  height = 300,
  data = {
    dates: [],
    values: [],
  },
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current)

    // 配置选项
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} 人',
      },
      grid: {
        left: '1%',
        right: '1%',
        bottom: '10%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.dates || [],
      },
      yAxis: {
        type: 'value',
        name: '访客数',
      },
      series: [
        {
          name: '访客数',
          type: 'line',
          data: data.values || [],
          smooth: true,
          itemStyle: {
            color: '#1890ff',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.1)' },
            ]),
          },
        },
      ],
    }

    // 设置图表选项
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

  // 检查是否有数据
  const isEmptyData =
    !data.dates || data.dates.length === 0 || !data.values || data.values.length === 0

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

export default VisitorTrendsChart
