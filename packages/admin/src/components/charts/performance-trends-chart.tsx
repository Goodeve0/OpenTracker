import React, { useEffect, useRef, useState } from 'react'
import { Spin, Empty } from 'antd'
import * as echarts from 'echarts'
import { queryStatsData } from '../../api/track'

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
  loading: propLoading = false,
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

  // 本地加载状态
  const [loading, setLoading] = useState(false)

  // 从后端API获取性能数据
  const pullPerformanceData = async () => {
    try {
      setLoading(true)
      // 获取性能均值数据
      const response = await queryStatsData({ type: 'performance_avg' })
      if (response.code === 200 && response.data) {
        const { dates, loadTimeAvg, firstPaintAvg, longTaskAvg, fpsAvg, resourceLoadAvg } =
          response.data

        // 转换数据格式为前端需要的格式
        const formattedHistories: Record<string, MetricHistoryPoint[]> = {
          inp: [],
          cls: [],
          longTask: [],
          fps: [],
          resourceLoad: [],
        }

        // 确保有数据
        if (dates.length > 0) {
          // 使用加载时间作为资源加载时间
          formattedHistories.resourceLoad = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v: resourceLoadAvg[index] || 0,
          }))

          // 使用首次绘制时间作为其他指标的参考
          formattedHistories.inp = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v: firstPaintAvg[index] || 0,
          }))

          // 使用longTaskAvg作为长任务时间
          formattedHistories.longTask = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v: longTaskAvg[index] || 0,
          }))

          // 使用fpsAvg作为帧率
          formattedHistories.fps = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v: fpsAvg[index] || 0,
          }))

          // cls暂时使用默认值
          formattedHistories.cls = dates.map((date) => ({
            t: new Date(date).getTime(),
            v: 0.1,
          }))
        }
        // 如果没有数据，保持空数组

        setHistories(formattedHistories)
      }
    } catch (error) {
      console.error('获取性能数据失败:', error)
      // 错误时保持空数据
      setHistories({
        inp: [],
        cls: [],
        longTask: [],
        fps: [],
        resourceLoad: [],
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始化图表和数据
  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    // 初始加载数据
    pullPerformanceData()

    // 设置定时刷新
    intervalRef.current = window.setInterval(pullPerformanceData, 60000) // 每分钟刷新一次

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

    // 与原页面完全相同的图表配置，不添加任何额外选项
    const opt = {
      tooltip: { trigger: 'axis' },
      legend: { data: seriesNames },
      xAxis: { type: 'category', data: timesLabels },
      yAxis: { type: 'value' },
      series,
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
