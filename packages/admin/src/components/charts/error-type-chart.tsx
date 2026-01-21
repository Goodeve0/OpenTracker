import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

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

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current)

    // 模拟数据（实际应从API获取）
    const data = [
      { value: 1048, name: 'JS错误' },
      { name: 'API错误', value: 735 },
      { name: '资源错误', value: 580 },
      { name: '框架错误', value: 484 },
      { name: '页面崩溃', value: 300 },
    ]

    // 配置选项 - 饼图
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
  }, [])

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

  return <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
}

export default ErrorTypeChart
