import React, { useEffect, useRef } from 'react'
import { Spin } from 'antd'
import * as echarts from 'echarts'

interface WhiteScreenTrendsChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const WhiteScreenTrendsChart: React.FC<WhiteScreenTrendsChartProps> = ({
  title = '白屏趋势分析',
  height = 300,
  loading = false,
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    // 模拟白屏趋势数据
    const xData = [
      '2025/12/14',
      '2025/12/15',
      '2025/12/16',
      '2025/12/17',
      '2025/12/18',
      '2025/12/19',
      '2025/12/20',
    ]
    const whiteScreenCount = [0, 5, 12, 16, 4, 10, 18]
    const affectedUserCount = [0, 1, 3, 2, 1, 2, 3]
    const whiteScreenRate = [0, 0.2, 0.45, 0.67, 0.25, 0.6, 1.2]
    const affectedUserRate = [0, 1.1, 0.9, 0.52, 0.3, 0.7, 1.15]

    const option = {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: number, series: any): string | number => {
          const seriesName: string = String(series?.name || '')
          if (seriesName.includes('率')) {
            return (value * 100).toFixed(2) + '%'
          }
          return typeof value === 'number' && !isNaN(value) ? value : 0
        },
      },
      legend: {
        data: ['白屏数', '影响用户数', '白屏率', '影响用户率'],
        bottom: 'bottom',
      },
      grid: {
        left: '1%',
        right: '1%',
        bottom: '25%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xData,
        axisLabel: {
          margin: 10,
          fontSize: 12,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '',
          position: 'left',
        },
        {
          type: 'value',
          name: '',
          position: 'right',
          axisLabel: {
            formatter: '{value} %',
          },
        },
      ],
      series: [
        {
          name: '白屏数',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#2d8cf0',
          },
          data: whiteScreenCount,
        },
        {
          name: '影响用户数',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#7c4dff',
          },
          data: affectedUserCount,
        },
        {
          name: '白屏率',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#00b894',
          },
          data: whiteScreenRate,
        },
        {
          name: '影响用户率',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#ff7675',
          },
          data: affectedUserRate,
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

export default WhiteScreenTrendsChart
