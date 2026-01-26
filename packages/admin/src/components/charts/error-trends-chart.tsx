import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

interface SeriesItem {
  name: string
  type: string
  smooth: boolean
  data: number[]
  itemStyle: {
    color: string
  }
}

interface ErrorTrendsData {
  dates: string[]
  series: SeriesItem[]
}

interface ErrorTrendsChartProps {
  title?: string
  height?: number
  loading?: boolean
  data?: ErrorTrendsData
}

const ErrorTrendsChart: React.FC<ErrorTrendsChartProps> = ({
  title = '错误趋势',
  height = 300,
  loading = false,
  data,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    // 默认空数据配置
    const defaultData: ErrorTrendsData = {
      dates: [],
      series: [],
    }

    const trendData = data || defaultData

    // 配置选项 - 调整grid配置，增加底部空间，避免图例和横轴重叠
    const option = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: trendData.series.map((s) => s.name),
        bottom: 'bottom', // 将图例放在底部，与横轴保持距离
      },
      grid: {
        left: '1%',
        right: '1%',
        bottom: '25%', // 增加底部空间，确保横轴标签和图例不重叠
        top: '15%', // 增加顶部空间
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.dates,
        axisLabel: {
          margin: 10, // 增加标签与轴线的距离
          fontSize: 12, // 减小字体大小
        },
      },
      yAxis: { type: 'value' },
      series: trendData.series,
    }

    chartInstance.current.setOption(option)

    // 添加延迟resize，确保容器大小已确定
    const resizeTimeout = setTimeout(() => {
      chartInstance.current?.resize()
    }, 100)

    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      chartInstance.current?.dispose()
    }
  }, [data])

  useEffect(() => {
    if (chartInstance.current) {
      if (loading) {
        chartInstance.current.showLoading()
      } else {
        chartInstance.current.hideLoading()
      }
    }
  }, [loading])

  // 检查是否为空数据
  const isEmptyData = !data || data.dates.length === 0 || data.series.length === 0

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

export default ErrorTrendsChart
