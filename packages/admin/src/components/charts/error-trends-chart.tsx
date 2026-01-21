import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

interface ErrorTrendsChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const ErrorTrendsChart: React.FC<ErrorTrendsChartProps> = ({
  title = '错误趋势',
  height = 300,
  loading = false,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    // 模拟数据（与错误分析页面一致）
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:00']
    const data = {
      jsError: [120, 132, 101, 134, 90, 230, 210],
      apiError: [220, 182, 191, 234, 290, 330, 310],
      resourceError: [150, 232, 201, 154, 190, 330, 410],
      frameworkError: [30, 42, 21, 54, 60, 80, 40],
      crashError: [2, 5, 1, 8, 3, 0, 2],
    }

    // 配置选项 - 调整grid配置，增加底部空间，避免图例和横轴重叠
    const option = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['JS错误', 'API错误', '资源错误', '框架错误', '页面崩溃'],
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
        data: hours,
        axisLabel: {
          margin: 10, // 增加标签与轴线的距离
          fontSize: 12, // 减小字体大小
        },
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'JS错误',
          type: 'line',
          smooth: true,
          data: data.jsError,
          itemStyle: { color: '#cf1322' },
        },
        {
          name: 'API错误',
          type: 'line',
          smooth: true,
          data: data.apiError,
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '资源错误',
          type: 'line',
          smooth: true,
          data: data.resourceError,
          itemStyle: { color: '#faad14' },
        },
        {
          name: '框架错误',
          type: 'line',
          smooth: true,
          data: data.frameworkError,
          itemStyle: { color: '#722ed1' },
        },
        {
          name: '页面崩溃',
          type: 'line',
          smooth: true,
          data: data.crashError,
          itemStyle: { color: '#eb2f96' },
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

export default ErrorTrendsChart
