import React, { useEffect, useRef, useState } from 'react'
import { Spin, Empty } from 'antd'
import * as echarts from 'echarts'

interface PerformanceTrendsChartProps {
  title?: string
  height?: number
  loading?: boolean
}

interface MetricHistoryPoint {
  t: number
  v: number
}

const PerformanceTrendsChart: React.FC<PerformanceTrendsChartProps> = ({
  title = '性能趋势',
  height = 300,
  loading = false,
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<echarts.ECharts | null>(null)
  const intervalRef = useRef<number | null>(null)

  // 各指标历史数据，与原性能页面保持一致
  const [histories, setHistories] = useState<Record<string, MetricHistoryPoint[]>>({
    inp: [],
    cls: [],
    longTask: [],
    fps: [],
    resourceLoad: [],
  })

  // 从性能收集器获取真实数据
  // 禁用从性能收集器获取真实数据，只使用静态mock数据
  const pullPerformanceData = () => {
    // 什么都不做，直接返回
    return
  }

  // 初始化图表和静态数据
  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    // 使用静态的mock数据，不再自动刷新
    const now = Date.now()
    // 生成合理的时间序列数据，确保图表能正常显示
    setHistories({
      inp: Array.from({ length: 20 }, (_, i) => ({
        t: now - (20 - i) * 1000,
        v: 200 + Math.random() * 300,
      })),
      cls: Array.from({ length: 20 }, (_, i) => ({
        t: now - (20 - i) * 1000,
        v: 0.05 + Math.random() * 0.15,
      })),
      longTask: Array.from({ length: 20 }, (_, i) => ({
        t: now - (20 - i) * 1000,
        v: 10 + Math.random() * 40,
      })),
      fps: Array.from({ length: 20 }, (_, i) => ({
        t: now - (20 - i) * 1000,
        v: 50 + Math.random() * 10,
      })),
      resourceLoad: Array.from({ length: 20 }, (_, i) => ({
        t: now - (20 - i) * 1000,
        v: 150 + Math.random() * 250,
      })),
    })

    const handleResize = () => {
      chartInstance.current?.resize()
    }

    // 添加延迟resize，确保容器大小已确定
    const resizeTimeout = setTimeout(() => {
      chartInstance.current?.resize()
    }, 100)

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      chartInstance.current?.dispose()
    }
  }, [])

  // 更新图表数据，当历史数据改变时
  useEffect(() => {
    const instLine = chartInstance.current
    if (!instLine) return

    // 收集所有时间戳
    const allTimesSet = new Set<number>()
    Object.values(histories).forEach((arr) => arr.forEach((p) => allTimesSet.add(p.t)))
    const allTimes = Array.from(allTimesSet).sort((a, b) => a - b)
    const timesLabels = allTimes.map((t) => new Date(t).toLocaleTimeString())

    // 准备多系列数据，与原性能页面相同的处理方式
    const seriesNames = ['inp', 'cls', 'longTask', 'fps', 'resourceLoad']
    const series = seriesNames.map((name) => {
      const valueMap = new Map<number, number>()
      ;(histories[name] || []).forEach((p) => valueMap.set(p.t, p.v))
      const data = allTimes.map((t) =>
        valueMap.has(t) ? Math.round(valueMap.get(t) as number) : null
      )
      return {
        name,
        type: 'line',
        data,
        smooth: true,
        // 为不同系列设置与原页面相同的颜色
        itemStyle: {
          color:
            {
              inp: '#1890ff',
              cls: '#52c41a',
              longTask: '#faad14',
              fps: '#722ed1',
              resourceLoad: '#f5222d',
            }[name] || '#1890ff',
        },
      }
    })

    // 调整图表配置，增加底部空间，避免图例和横轴重叠
    const opt = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: seriesNames,
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
        data: timesLabels,
        axisLabel: {
          margin: 10, // 增加标签与轴线的距离
          fontSize: 12, // 减小字体大小
        },
      },
      yAxis: { type: 'value' },
      series: series,
    }

    try {
      instLine.setOption(opt)
    } catch (err) {
      console.error('更新图表数据失败:', err)
    }
  }, [histories])

  useEffect(() => {
    if (chartInstance.current) {
      if (loading) {
        chartInstance.current.showLoading()
      } else {
        chartInstance.current.hideLoading()
      }
    }
  }, [loading])

  return (
    <div>
      <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
    </div>
  )
}

export default PerformanceTrendsChart
