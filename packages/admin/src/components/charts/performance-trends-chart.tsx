import React, { useEffect, useRef, useState } from 'react'
import { Spin, Empty } from 'antd'
import * as echarts from 'echarts'
// 直接从SDK导入performanceCollector单例，与原性能页面相同
import { performanceCollector as importedCollector } from '../../../../sdk/plugins/src/performance'

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

  // 新增：收集器是否可用状态，与原性能页面保持一致
  const [collectorAvailable, setCollectorAvailable] = useState<boolean>(true)

  // 从性能收集器获取真实数据
  // 与原性能页面完全相同的实现
  const pullPerformanceData = () => {
    // 尝试从导入的 singleton 或 window 上获取 collector，与原页面完全相同
    const collector =
      importedCollector ||
      (window as any).performanceCollector ||
      (window as any).opentracker?.performanceCollector ||
      null
    if (!collector) {
      setCollectorAvailable(false)
      return
    }

    try {
      let report: any = null
      if (typeof collector.getReportData === 'function') report = collector.getReportData()
      else if (typeof collector.getPerformanceData === 'function') {
        report = {
          performanceData: collector.getPerformanceData(),
          timestamp: Date.now(),
          pageURL: location.href,
          userAgent: navigator.userAgent,
        }
      }

      if (!report) return

      const p = report.performanceData || report
      const now = Date.now()

      // 更新各指标历史，保留最近60条数据
      const updateHistory = (key: string, val: any) => {
        if (typeof val === 'number' && !Number.isNaN(val)) {
          setHistories((prev) => {
            const arr = (prev[key] || []).concat({ t: now, v: val })
            return { ...prev, [key]: arr.slice(-60) }
          })
        }
      }

      // 更新核心指标
      if (p.coreVitals) {
        updateHistory('inp', p.coreVitals.inp)
        updateHistory('cls', p.coreVitals.cls)
      }

      // 更新运行时指标
      if (p.runtimePerformance) {
        updateHistory('longTask', p.runtimePerformance.longTask)
        updateHistory('fps', p.runtimePerformance.fps)
        updateHistory('resourceLoad', p.runtimePerformance.resourceLoad)
      }

      setCollectorAvailable(true)
    } catch (e) {
      console.error('获取性能数据失败:', e)
      setCollectorAvailable(false)
    }
  }

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return

    chartInstance.current = echarts.init(chartRef.current)

    // 开始定时拉取数据
    pullPerformanceData()
    intervalRef.current = window.setInterval(pullPerformanceData, 1000)

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
      {/* 显示收集器不可用提示，与原性能页面保持一致 */}
      {!collectorAvailable ? (
        <div
          style={{
            padding: '10px',
            background: '#fff3cd',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: `${height}px`,
            width: '100%',
          }}
        >
          未检测到 SDK 的 `performanceCollector` 实例。确认 SDK 在页面中初始化并导出
          `performanceCollector` 或将其挂载到 `window.performanceCollector`。
        </div>
      ) : (
        <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
      )}
    </div>
  )
}

export default PerformanceTrendsChart
