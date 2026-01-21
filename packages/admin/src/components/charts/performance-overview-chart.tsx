import React, { useEffect, useRef, useState } from 'react'
import { Spin, Empty } from 'antd'
import * as echarts from 'echarts'
// 直接从SDK导入performanceCollector单例，与原性能页面相同
import { performanceCollector as importedCollector } from '../../../../sdk/plugins/src/performance'

interface PerformanceOverviewChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const PerformanceOverviewChart: React.FC<PerformanceOverviewChartProps> = ({
  title = '性能分布',
  height = 300,
  loading = false,
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null)
  const chartInstance = React.useRef<echarts.ECharts | null>(null)
  const intervalRef = useRef<number | null>(null)

  // 核心指标数据，与原性能页面保持一致
  const [coreVitals, setCoreVitals] = useState({
    lcp: null as number | null,
    inp: null as number | null,
    cls: null as number | null,
  })

  // 新增：收集器是否可用状态，与原性能页面保持一致
  const [collectorAvailable, setCollectorAvailable] = useState<boolean>(true)

  // Helper: compute distribution categories for a numeric array
  // 与原性能页面相同的分布计算逻辑
  const computeDistribution = (vals: number[], thresholds: [number, number]) => {
    const [t1, t2] = thresholds
    let good = 0,
      mid = 0,
      poor = 0
    vals.forEach((v) => {
      if (v <= t1) good++
      else if (v <= t2) mid++
      else poor++
    })
    return [
      { name: '良好', value: good },
      { name: '需改善', value: mid },
      { name: '较差', value: poor },
    ]
  }

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
      if (p.coreVitals) {
        setCoreVitals(p.coreVitals)
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

  // 更新图表数据，当核心指标改变时设置 option
  // 与原性能页面完全相同的处理逻辑
  useEffect(() => {
    const instPie = chartInstance.current
    if (!instPie) return

    // Prepare values arrays (过滤 null) - 与原页面完全相同
    const coreVals: number[] = []
    if (typeof coreVitals.lcp === 'number') coreVals.push(coreVitals.lcp)
    if (typeof coreVitals.inp === 'number') coreVals.push(coreVitals.inp)
    if (typeof coreVitals.cls === 'number') coreVals.push(coreVitals.cls)

    // Pie: use LCP thresholds (example: good <=2500ms, mid<=4000) - 与原页面完全相同
    // 原页面的奇怪转换，我们也保留
    const valsForPie = coreVals.map((v) => (v >= 1000 ? v : v)) // keep as-is
    const pieData = computeDistribution(
      valsForPie.map((v) => Math.round(v)),
      [2500, 4000]
    )

    // 与原页面完全相同的图表配置，不添加任何额外选项
    // 原页面的奇怪转换，我们也保留
    const opt = {
      tooltip: { trigger: 'item' },
      series: [{ type: 'pie', radius: '60%', data: pieData }],
    }

    try {
      instPie.setOption(opt)
    } catch (err) {
      console.error('更新图表数据失败:', err)
    }
  }, [coreVitals])

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

export default PerformanceOverviewChart
