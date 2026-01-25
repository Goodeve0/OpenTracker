import React, { useEffect, useRef } from 'react'
import { Spin } from 'antd'
import * as echarts from 'echarts'

interface WhiteScreenTrendData {
  date: string
  whiteScreenCount: number
  affectedUserCount: number
  whiteScreenRate: number
  affectedUserRate: number
}

interface WhiteScreenTrendsChartProps {
  title?: string
  height?: number
  loading?: boolean
  data?: WhiteScreenTrendData[]
}

const WhiteScreenTrendsChart: React.FC<WhiteScreenTrendsChartProps> = ({
  title = '白屏趋势分析',
  height = 300,
  loading = false,
  data = [],
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    // 处理数据，转换为图表所需格式
    const xData = data.map((item) => item.date)
    const whiteScreenCount = data.map((item) => item.whiteScreenCount)
    const affectedUserCount = data.map((item) => item.affectedUserCount)
    const whiteScreenRate = data.map((item) => item.whiteScreenRate)
    const affectedUserRate = data.map((item) => item.affectedUserRate)

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

  // 检查是否有数据
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

export default WhiteScreenTrendsChart
