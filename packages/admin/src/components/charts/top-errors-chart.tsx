import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

interface TopErrorsChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const TopErrorsChart: React.FC<TopErrorsChartProps> = ({
  title = '高频报错页面',
  height = 300,
  loading = false,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    // 模拟数据 - 与错误分析页面一致
    const pages = ['/home', '/login', '/product/detail', '/cart', '/payment']
    const data = [18203, 23489, 29034, 104970, 131744]

    // 配置选项 - 柱状图
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'value', boundaryGap: [0, 0.01] },
      yAxis: {
        type: 'category',
        data: pages,
        axisLabel: { interval: 0, width: 80, overflow: 'truncate' },
      },
      series: [
        {
          name: '报错次数',
          type: 'bar',
          data: data,
          itemStyle: { color: '#597ef7' },
        },
      ],
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
  }, [])

  useEffect(() => {
    if (chartInstance.current) {
      if (loading) {
        chartInstance.current.showLoading()
      } else {
        chartInstance.current.hideLoading()
      }
    }
  }, [loading])

  return <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
}

export default TopErrorsChart
