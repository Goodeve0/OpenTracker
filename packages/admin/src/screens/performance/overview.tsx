import React, { useEffect, useState, useRef } from 'react'
import { Row, Col, Card, Layout, Space, Statistic } from 'antd'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../types'
import { queryStatsData } from '../../api/track'

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

const { Content } = Layout

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

  const pull = async () => {
    try {
      console.log('开始获取性能数据...')
      // 从后端API获取性能数据
      const response = await queryStatsData({ type: 'performance_avg' })
      console.log('获取性能数据响应:', response)

      if (response && response.code === 200 && response.data) {
        const performanceData = response.data
        console.log('性能数据:', performanceData)

        const {
          dates = [],
          loadTimeAvg = [],
          firstPaintAvg = [],
          domReadyAvg = [],
          ttfbAvg = [],
          dnsAvg = [],
          tcpAvg = [],
          longTaskAvg = [],
          fpsAvg = [],
          resourceLoadAvg = [],
          lcpAvg = [],
          inpAvg = [],
          fcpAvg = [],
          dclAvg = [],
        } = performanceData

        const now = Date.now()

        // 确保有数据
        if (Array.isArray(dates) && dates.length > 0) {
          console.log('有性能数据，开始处理...')
          // 打印核心指标数据，用于调试
          console.log('LCP数据:', lcpAvg, 'Load数据:', loadTimeAvg)
          console.log('INP数据:', inpAvg, 'FirstPaint数据:', firstPaintAvg)
          console.log('DCL数据:', dclAvg, 'DomReady数据:', domReadyAvg)

          // 设置核心指标数据
          setCore({
            lcp:
              (Array.isArray(lcpAvg) && lcpAvg.length > 0 ? lcpAvg[lcpAvg.length - 1] : null) ||
              (Array.isArray(loadTimeAvg) && loadTimeAvg.length > 0
                ? loadTimeAvg[loadTimeAvg.length - 1]
                : null) ||
              0, // 最大内容绘制时间（毫秒）
            inp:
              (Array.isArray(inpAvg) && inpAvg.length > 0 ? inpAvg[inpAvg.length - 1] : null) ||
              (Array.isArray(firstPaintAvg) && firstPaintAvg.length > 0
                ? firstPaintAvg[firstPaintAvg.length - 1]
                : null) ||
              0, // 交互到下次绘制时间（毫秒）
            cls: 0.1, // 累积布局偏移
          })

          // 设置加载性能数据
          setLoading({
            ttfb: Array.isArray(ttfbAvg) && ttfbAvg.length > 0 ? ttfbAvg[ttfbAvg.length - 1] : null, // 首字节时间
            fp:
              Array.isArray(firstPaintAvg) && firstPaintAvg.length > 0
                ? firstPaintAvg[firstPaintAvg.length - 1]
                : null, // 首次绘制
            fcp:
              (Array.isArray(fcpAvg) && fcpAvg.length > 0 ? fcpAvg[fcpAvg.length - 1] : null) ||
              (Array.isArray(firstPaintAvg) && firstPaintAvg.length > 0
                ? firstPaintAvg[firstPaintAvg.length - 1]
                : null) ||
              null, // 首次内容绘制
            dcl:
              (Array.isArray(dclAvg) && dclAvg.length > 0 ? dclAvg[dclAvg.length - 1] : null) ||
              (Array.isArray(domReadyAvg) && domReadyAvg.length > 0
                ? domReadyAvg[domReadyAvg.length - 1]
                : null) ||
              0, // DOM内容加载完成
            load:
              Array.isArray(loadTimeAvg) && loadTimeAvg.length > 0
                ? loadTimeAvg[loadTimeAvg.length - 1]
                : null, // 页面完全加载
          })

          // 设置网络性能数据
          setNetwork({
            dns: Array.isArray(dnsAvg) && dnsAvg.length > 0 ? dnsAvg[dnsAvg.length - 1] : null, // DNS解析时间
            tcp: Array.isArray(tcpAvg) && tcpAvg.length > 0 ? tcpAvg[tcpAvg.length - 1] : null, // TCP连接时间
          })

          // 设置运行时性能数据
          setRuntime({
            longTask:
              Array.isArray(longTaskAvg) && longTaskAvg.length > 0
                ? longTaskAvg[longTaskAvg.length - 1]
                : null, // 长任务时间
            fps: Array.isArray(fpsAvg) && fpsAvg.length > 0 ? fpsAvg[fpsAvg.length - 1] : null, // 帧率
            resourceLoad:
              Array.isArray(resourceLoadAvg) && resourceLoadAvg.length > 0
                ? resourceLoadAvg[resourceLoadAvg.length - 1]
                : null, // 资源加载时间
          })

          // 设置最后更新时间
          setLastUpdate(now)

          // 设置历史数据，用于折线图
          const formattedHistories: Record<string, Array<{ t: number; v: number }>> = {
            inp: [],
            cls: [],
            longTask: [],
            fps: [],
            resourceLoad: [],
            lcp: [],
            fcp: [],
            dcl: [],
            load: [],
          }

          // 使用加载时间作为资源加载时间
          formattedHistories.resourceLoad = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v: (Array.isArray(resourceLoadAvg) && resourceLoadAvg[index]) || 0,
          }))

          // 使用inpAvg作为INP指标
          formattedHistories.inp = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v:
              (Array.isArray(inpAvg) && inpAvg[index]) ||
              (Array.isArray(firstPaintAvg) && firstPaintAvg[index]) ||
              0,
          }))

          // 使用lcpAvg作为LCP指标
          formattedHistories.lcp = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v:
              (Array.isArray(lcpAvg) && lcpAvg[index]) ||
              (Array.isArray(loadTimeAvg) && loadTimeAvg[index]) ||
              0,
          }))

          // 使用fcpAvg作为FCP指标
          formattedHistories.fcp = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v:
              (Array.isArray(fcpAvg) && fcpAvg[index]) ||
              (Array.isArray(firstPaintAvg) && firstPaintAvg[index]) ||
              0,
          }))

          // 使用dclAvg作为DCL指标
          formattedHistories.dcl = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v:
              (Array.isArray(dclAvg) && dclAvg[index]) ||
              (Array.isArray(domReadyAvg) && domReadyAvg[index]) ||
              0,
          }))

          // 使用loadTimeAvg作为Load指标
          formattedHistories.load = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v: (Array.isArray(loadTimeAvg) && loadTimeAvg[index]) || 0,
          }))

          // 使用longTaskAvg作为长任务时间
          formattedHistories.longTask = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v: (Array.isArray(longTaskAvg) && longTaskAvg[index]) || 0,
          }))

          // 使用fpsAvg作为帧率
          formattedHistories.fps = dates.map((date, index) => ({
            t: new Date(date).getTime(),
            v: (Array.isArray(fpsAvg) && fpsAvg[index]) || 0,
          }))

          // cls暂时使用默认值
          formattedHistories.cls = dates.map((date) => ({
            t: new Date(date).getTime(),
            v: 0.1,
          }))

          console.log('处理后的历史数据:', formattedHistories)
          setHistories(formattedHistories)
        } else {
          console.log('没有性能数据')
          // 如果没有数据，保持空值
          setCore({ lcp: null, inp: null, cls: null })
          setLoading({ ttfb: null, fp: null, fcp: null, dcl: null, load: null })
          setNetwork({ dns: null, tcp: null })
          setRuntime({ longTask: null, fps: null, resourceLoad: null })
          setLastUpdate(null)
          setHistories({
            inp: [],
            cls: [],
            longTask: [],
            fps: [],
            resourceLoad: [],
            lcp: [],
            fcp: [],
            dcl: [],
            load: [],
          })
        }
      } else {
        console.log('获取性能数据失败: 响应格式不正确')
        // 如果响应格式不正确，保持空值
        setCore({ lcp: null, inp: null, cls: null })
        setLoading({ ttfb: null, fp: null, fcp: null, dcl: null, load: null })
        setNetwork({ dns: null, tcp: null })
        setRuntime({ longTask: null, fps: null, resourceLoad: null })
        setLastUpdate(null)
        setHistories({
          inp: [],
          cls: [],
          longTask: [],
          fps: [],
          resourceLoad: [],
          lcp: [],
          fcp: [],
          dcl: [],
          load: [],
        })
      }
    } catch (error) {
      console.error('获取性能数据失败:', error)

      // 错误时保持空值
      setCore({ lcp: null, inp: null, cls: null })
      setLoading({ ttfb: null, fp: null, fcp: null, dcl: null, load: null })
      setNetwork({ dns: null, tcp: null })
      setRuntime({ longTask: null, fps: null, resourceLoad: null })
      setLastUpdate(null)
      setHistories({
        inp: [],
        cls: [],
        longTask: [],
        fps: [],
        resourceLoad: [],
        lcp: [],
        fcp: [],
        dcl: [],
        load: [],
      })
    }
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
      Object.values(histories).forEach((arr) => {
        if (Array.isArray(arr)) {
          arr.forEach((p) => {
            if (p && typeof p.t === 'number') {
              allTimesSet.add(p.t)
            }
          })
        }
      })
      const allTimes = Array.from(allTimesSet).sort((a, b) => a - b)
      const timesLabels = allTimes.map((t) => new Date(t).toLocaleTimeString())

      const seriesNames = ['inp', 'cls', 'longTask', 'fps', 'resourceLoad']
      const series = seriesNames.map((name) => {
        const valueMap = new Map<number, number>()
        const historyData = histories[name]
        if (Array.isArray(historyData)) {
          historyData.forEach((p) => {
            if (p && typeof p.t === 'number' && typeof p.v === 'number') {
              valueMap.set(p.t, p.v)
            }
          })
        }
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
      } catch (error) {
        console.error('设置图表选项失败:', error)
      }
    }
  }, [core, loading, network, runtime, histories])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ display: 'flex' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000e0' }}>性能监控</div>
          <Row gutter={16}>
            <Col span={6}>
              <Card title="核心 Web Vitals">
                <p>LCP: {fmtMs(core.lcp)}</p>
                <p>INP: {fmtMs(core.inp)}</p>
                <p>CLS: {core.cls != null ? String(core.cls) : '—'}</p>
              </Card>
            </Col>
            <Col span={6}>
              <Card title="加载性能">
                <p>TTFB: {fmtMs(loading.ttfb)}</p>
                <p>FCP: {fmtMs(loading.fcp ?? loading.fp)}</p>
                <p>DCL: {fmtMs(loading.dcl)}</p>
                <p>Load: {fmtMs(loading.load)}</p>
              </Card>
            </Col>
            <Col span={6}>
              <Card title="网络">
                <p>DNS: {fmtMs(network.dns)}</p>
                <p>TCP: {fmtMs(network.tcp)}</p>
              </Card>
            </Col>
            <Col span={6}>
              <Card title="运行时">
                <p>
                  长任务 (ms):{' '}
                  {runtime.longTask != null ? Math.round(runtime.longTask as number) : '—'}
                </p>
                <p>FPS: {runtime.fps != null ? Math.round(runtime.fps as number) : '—'}</p>
                <p>资源平均耗时: {fmtMs(runtime.resourceLoad)}</p>
              </Card>
            </Col>
          </Row>

          <Row justify="space-between" align="middle">
            <Col>
              <button style={{ marginRight: 10 }} onClick={() => pull()}>
                手动刷新
              </button>
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
            </Col>
            <Col>
              <Space>
                <div style={{ marginLeft: 'auto', color: '#666' }}>
                  最后更新时间: {lastUpdate ? new Date(lastUpdate).toLocaleString() : '—'}
                </div>
              </Space>
            </Col>
          </Row>

          {/* Charts area：仅保留饼图与多指标折线图 */}
          <Row gutter={16}>
            <Col span={12}>
              <ChartWithAdd
                chartType={ChartType.PERFORMANCE_OVERVIEW}
                title="性能分布（饼状图）"
                description="展示网站性能指标的分布情况"
                category="性能分析"
                defaultSize="medium"
              >
                <div ref={pieRef} style={{ width: '100%', height: 240 }} />
              </ChartWithAdd>
            </Col>
            <Col span={12}>
              <ChartWithAdd
                chartType={ChartType.PERFORMANCE_TRENDS}
                title="多指标趋势（折线图）"
                description="展示各项性能指标的变化趋势"
                category="性能分析"
                defaultSize="medium"
              >
                <div ref={lineRef} style={{ width: '100%', height: 240 }} />
              </ChartWithAdd>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
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
            </Col>
          </Row>
        </Space>
      </Content>
    </Layout>
  )
}

export default PerformancePage
