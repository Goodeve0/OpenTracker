import React, { useEffect, useState, useRef } from 'react'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../types'

type CoreVitals = { lcp?: number | null; inp?: number | null; cls?: number | null }
type LoadingPerf = {
  ttfb?: number | null
  fp?: number | null
  fcp?: number | null
  dcl?: number | null
  load?: number | null
}
type NetworkPerf = { dns?: number | null; tcp?: number | null }
type RuntimePerf = { longTask?: number | null; fps?: number | null; resourceLoad?: number | null }

const fmtMs = (v?: number | null) => {
  if (v === null || v === undefined) return '—'
  if (v >= 1000) return (v / 1000).toFixed(2) + ' s'
  return Math.round(v) + ' ms'
}

const PerformancePage: React.FC = () => {
  const [core, setCore] = useState<CoreVitals>({ lcp: null, inp: null, cls: null })
  const [loading, setLoading] = useState<LoadingPerf>({
    ttfb: null,
    fp: null,
    fcp: null,
    dcl: null,
    load: null,
  })
  const [network, setNetwork] = useState<NetworkPerf>({ dns: null, tcp: null })
  const [runtime, setRuntime] = useState<RuntimePerf>({
    longTask: null,
    fps: null,
    resourceLoad: null,
  })
  const [rawReport, setRawReport] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  // ECharts 引用与实例（仅保留饼图与折线图）
  const pieRef = useRef<HTMLDivElement | null>(null)
  const lineRef = useRef<HTMLDivElement | null>(null)
  const chartInstances = useRef<any>({ pie: null, line: null })
  // histories for multiple metrics (keep last 60 samples each)
  const [histories, setHistories] = useState<Record<string, Array<{ t: number; v: number }>>>({
    inp: [],
    cls: [],
    longTask: [],
    fps: [],
    resourceLoad: [],
  })

  const pull = () => {
    // 使用静态的mock数据，不再从SDK获取
    const now = Date.now()

    // 设置静态的核心指标数据
    setCore({
      lcp: 1200, // 最大内容绘制时间（毫秒）
      inp: 300, // 交互到下次绘制时间（毫秒）
      cls: 0.1, // 累积布局偏移
    })

    // 设置静态的加载性能数据
    setLoading({
      ttfb: 100, // 首字节时间
      fp: 500, // 首次绘制
      fcp: 800, // 首次内容绘制
      dcl: 1500, // DOM内容加载完成
      load: 2000, // 页面完全加载
    })

    // 设置静态的网络性能数据
    setNetwork({
      dns: 50, // DNS解析时间
      tcp: 100, // TCP连接时间
    })

    // 设置静态的运行时性能数据
    setRuntime({
      longTask: 30, // 长任务时间
      fps: 55, // 帧率
      resourceLoad: 200, // 资源加载时间
    })

    // 设置最后更新时间
    setLastUpdate(now)

    // 设置静态的历史数据，用于折线图
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
  }

  useEffect(() => {
    pull() // 只执行一次，不再自动刷新
  }, [])

  // 动态加载 echarts 并初始化图表实例
  useEffect(() => {
    let mounted = true
    let echarts: any = null
    const initCharts = async () => {
      try {
        // 动态按需加载 echarts
        echarts = await import('echarts')
        if (!mounted) return
        const e = (echarts as any).default || echarts
        try {
          // 仅初始化饼图与折线图实例
          if (pieRef.current) chartInstances.current.pie = e.init(pieRef.current)
          if (lineRef.current) chartInstances.current.line = e.init(lineRef.current)

          // 图表实例初始化完成后，手动触发一次数据更新
          pull()
        } catch (err) {
          console.warn('echarts 初始化错误', err)
        }
      } catch (err) {
        console.warn('echarts 未安装或加载失败:', err)
      }
    }
    initCharts()

    return () => {
      mounted = false
      try {
        Object.values(chartInstances.current).forEach((ins: any) => {
          if (ins && typeof ins.dispose === 'function') ins.dispose()
        })
      } catch (_) {}
    }
  }, [])

  // Helper: compute distribution categories for a numeric array
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

  // 更新图表数据，当 metrics 改变时设置 option
  useEffect(() => {
    // 仅取出已初始化的饼图与折线图实例
    const instPie = chartInstances.current.pie
    const instLine = chartInstances.current.line

    // Prepare values arrays (过滤 null)
    const coreVals: number[] = []
    if (typeof core.lcp === 'number') coreVals.push(core.lcp)
    if (typeof core.inp === 'number') coreVals.push(core.inp)
    if (typeof core.cls === 'number') coreVals.push(core.cls)

    // Pie: use LCP thresholds (example: good <=2500ms, mid<=4000)
    if (instPie) {
      const valsForPie = coreVals.map((v) => (v >= 1000 ? v : v)) // keep as-is
      const pieData = computeDistribution(
        valsForPie.map((v) => Math.round(v)),
        [2500, 4000]
      )
      const opt = {
        tooltip: { trigger: 'item' },
        series: [{ type: 'pie', radius: '60%', data: pieData }],
      }
      try {
        instPie.setOption(opt)
      } catch (_) {}
    }

    // Line: multi-series over time for inp, cls, longTask, fps, resourceLoad
    if (instLine) {
      // collect all timestamps
      const allTimesSet = new Set<number>()
      Object.values(histories).forEach((arr) => arr.forEach((p) => allTimesSet.add(p.t)))
      const allTimes = Array.from(allTimesSet).sort((a, b) => a - b)
      const timesLabels = allTimes.map((t) => new Date(t).toLocaleTimeString())

      const seriesNames = ['inp', 'cls', 'longTask', 'fps', 'resourceLoad']
      const series = seriesNames.map((name) => {
        const valueMap = new Map<number, number>()
        ;(histories[name] || []).forEach((p) => valueMap.set(p.t, p.v))
        const data = allTimes.map((t) =>
          valueMap.has(t) ? Math.round(valueMap.get(t) as number) : null
        )
        return { name, type: 'line', data, smooth: true }
      })

      const opt = {
        tooltip: { trigger: 'axis' },
        legend: { data: seriesNames },
        xAxis: { type: 'category', data: timesLabels },
        yAxis: { type: 'value' },
        series,
      }
      try {
        instLine.setOption(opt)
      } catch (_) {}
    }
  }, [core, loading, network, runtime, histories])

  return (
    <div className="performance-page" style={{ padding: 16 }}>
      <h2>性能监控</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
          gap: 12,
          marginTop: 12,
        }}
      >
        <section style={{ padding: 12, background: '#fff', borderRadius: 6 }}>
          <h3>核心 Web Vitals</h3>
          <div>
            LCP: <strong>{fmtMs(core.lcp)}</strong>
          </div>
          <div>
            INP: <strong>{fmtMs(core.inp)}</strong>
          </div>
          <div>
            CLS: <strong>{core.cls != null ? String(core.cls) : '—'}</strong>
          </div>
        </section>

        <section style={{ padding: 12, background: '#fff', borderRadius: 6 }}>
          <h3>加载性能</h3>
          <div>
            TTFB: <strong>{fmtMs(loading.ttfb)}</strong>
          </div>
          <div>
            FCP: <strong>{fmtMs(loading.fcp ?? loading.fp)}</strong>
          </div>
          <div>
            DCL: <strong>{fmtMs(loading.dcl)}</strong>
          </div>
          <div>
            Load: <strong>{fmtMs(loading.load)}</strong>
          </div>
        </section>

        <section style={{ padding: 12, background: '#fff', borderRadius: 6 }}>
          <h3>网络</h3>
          <div>
            DNS: <strong>{fmtMs(network.dns)}</strong>
          </div>
          <div>
            TCP: <strong>{fmtMs(network.tcp)}</strong>
          </div>
        </section>

        <section style={{ padding: 12, background: '#fff', borderRadius: 6 }}>
          <h3>运行时</h3>
          <div>
            长任务 (ms):{' '}
            <strong>
              {runtime.longTask != null ? Math.round(runtime.longTask as number) : '—'}
            </strong>
          </div>
          <div>
            FPS: <strong>{runtime.fps != null ? Math.round(runtime.fps as number) : '—'}</strong>
          </div>
          <div>
            资源平均耗时: <strong>{fmtMs(runtime.resourceLoad)}</strong>
          </div>
        </section>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => pull()}>手动刷新</button>
        <button
          onClick={() => {
            setCore({ lcp: null, inp: null, cls: null })
            setLoading({ ttfb: null, fp: null, fcp: null, dcl: null, load: null })
            setNetwork({ dns: null, tcp: null })
            setRuntime({ longTask: null, fps: null, resourceLoad: null })
            setRawReport(null)
            setLastUpdate(null)
          }}
        >
          清空
        </button>

        <div style={{ marginLeft: 'auto', color: '#666' }}>
          最后更新时间: {lastUpdate ? new Date(lastUpdate).toLocaleString() : '—'}
        </div>
      </div>

      {/* Charts area：仅保留饼图与多指标折线图 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <ChartWithAdd
          chartType={ChartType.PERFORMANCE_OVERVIEW}
          title="性能分布（饼状图）"
          description="展示网站性能指标的分布情况"
          category="性能分析"
          defaultSize="medium"
        >
          <div ref={pieRef} style={{ width: '100%', height: 240 }} />
        </ChartWithAdd>

        <ChartWithAdd
          chartType={ChartType.PERFORMANCE_TRENDS}
          title="多指标趋势（折线图）"
          description="展示各项性能指标的变化趋势"
          category="性能分析"
          defaultSize="medium"
        >
          <div ref={lineRef} style={{ width: '100%', height: 240 }} />
        </ChartWithAdd>
      </div>

      <div style={{ marginTop: 12 }}>
        <details>
          <summary>原始报告（JSON）</summary>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#f7f7f7',
              padding: 12,
              borderRadius: 6,
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            {rawReport ? JSON.stringify(rawReport, null, 2) : '—'}
          </pre>
        </details>
      </div>
    </div>
  )
}

export default PerformancePage
