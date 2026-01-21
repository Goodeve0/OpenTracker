import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import { Card } from 'antd'

interface VisitorTrendsChartProps {
  title?: string
  height?: number
}

const VisitorTrendsChart: React.FC<VisitorTrendsChartProps> = ({
  title = '访客趋势',
  height = 300,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current)

    // 模拟数据
    const data = [
      { name: '1月', value: 1200 },
      { name: '2月', value: 1900 },
      { name: '3月', value: 3000 },
      { name: '4月', value: 2500 },
      { name: '5月', value: 4000 },
      { name: '6月', value: 3500 },
    ]

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
        data: data.map((item) => item.name),
      },
      yAxis: {
        type: 'value',
        name: '访客数',
      },
      series: [
        {
          name: '访客数',
          type: 'line',
          data: data.map((item) => item.value),
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
  }, [])

  return <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
}

export default VisitorTrendsChart
