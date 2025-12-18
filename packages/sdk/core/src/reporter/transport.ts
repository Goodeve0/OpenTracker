import { TrackEvent, TransportConfig } from '../../../types/src/core/config.js'
import { ReportStrategy } from '../../../common/index.js'
import { Retryer } from './retry.js'

// 转换事件类型
const transformEventType = (eventType: string): string => {
  if (eventType === 'white_screen') {
    return 'blank'
  }
  return eventType
}

// 格式化单个事件数据
const formatEventForServer = (event: TrackEvent): { type: string; data: any } => {
  return {
    type: transformEventType(event.type),
    data: {
      ...event.data,
      timestamp: event.timestamp || Date.now(),
      apiKey: event.data._apiKey || '',
      eventName: event.event,
    },
  }
}

// 通过sendBeacon上报：页面卸载优先，无阻塞，支持跨域
const reportByBeacon = (serverUrl: string, events: TrackEvent[]): boolean => {
  try {
    //循环发送每个事件
    for (const event of events) {
      const payload = JSON.stringify(formatEventForServer(event))
      const blob = new Blob([payload], { type: 'application/json; charset=utf-8' })
      // sendBeacon返回布尔值，表示是否成功加入浏览器发送队列
      const success = navigator.sendBeacon(serverUrl, blob)
      if (!success) {
        return false
      }
    }
    return true
  } catch (error) {
    console.error(`[Transports:Beacon] 上报异常：${(error as Error).message}`)
    return false
  }
}

// 通过XHR上报：可控性强，支持复杂数据和重试，支持跨域
const reportByXHR = (serverUrl: string, events: TrackEvent[]): Promise<boolean> => {
  return new Promise(async (resolve) => {
    try {
      // 循环发送每个事件
      for (const event of events) {
        const payload = formatEventForServer(event)
        const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          resolve(false)
          return
        }
      }
      resolve(true)
    } catch (error) {
      console.error(`[Transports:XHR] 上报异常：${(error as Error).message}`)
      resolve(false)
    }
  })
}

// 通过IMG标签上报：跨域友好，适合大数据量批量上报，支持跨域
const reportByIMG = (serverUrl: string, events: TrackEvent[]): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      //循环发送每个事件
      let successCount = 0
      const totalEvents = events.length

      const onLoadOrError = () => {
        successCount++
        if (successCount === totalEvents) {
          resolve(true)
        }
      }

      for (const event of events) {
        const payload = encodeURIComponent(JSON.stringify(formatEventForServer(event)))
        const img = new Image()

        // 上报成功或失败都计数
        img.onload = onLoadOrError
        img.onerror = onLoadOrError

        // 触发上报
        img.src = `${serverUrl}?data=${payload}`
      }
    } catch (error) {
      console.error(`[Transports:IMG] 上报异常：${(error as Error).message}`)
      resolve(false)
    }
  })
}

//  传输策略核心类
export class Transport {
  private serverUrl: string // 上报地址
  private debug: boolean // 调试模式
  private retryer: Retryer // 重试器实例
  constructor(config: TransportConfig) {
    this.serverUrl = config.serverUrl
    this.debug = config.debug || false
    this.retryer = new Retryer() // 初始化重试器
    this.log('传输层初始化成功')
  }

  // 根据事件数和页面状态选择上报策略
  private selectStrategy(
    isImmediate: boolean,
    isUnloading: boolean,
    eventCount: number
  ): ReportStrategy {
    if (isUnloading || isImmediate) {
      // 页面卸载/立即上报：优先Beacon（浏览器支持的话）
      return 'sendBeacon' in navigator ? ReportStrategy.BEACON : ReportStrategy.XHR
    }
    // 批量上报：根据事件数选择IMG/XHR
    return eventCount > 15 ? ReportStrategy.IMG : ReportStrategy.XHR
  }

  // 核心发送方法：选择策略并执行上报，失败后触发重试
  public send(
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    retryCount: number
  ): void {
    const strategy = this.selectStrategy(isImmediate, isUnloading, events.length)
    this.log(`选择上报策略：${strategy}，待上报事件数：${events.length}`)

    // 根据策略执行上报
    switch (strategy) {
      case ReportStrategy.BEACON:
        this.handleBeacon(events, isImmediate, isUnloading, retryCount)
        break
      case ReportStrategy.XHR:
        this.handleXHR(events, isImmediate, isUnloading, retryCount)
        break
      case ReportStrategy.IMG:
        this.handleIMG(events, isImmediate, isUnloading, retryCount)
        break
    }
  }

  // 处理Beacon上报：失败后触发重试
  private handleBeacon(
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    retryCount: number
  ): void {
    const success = reportByBeacon(this.serverUrl, events)
    if (success) {
      this.log('Beacon上报成功')
    } else {
      this.log('Beacon上报失败，触发重试', 'warn')
      this.retryer.retry(this, events, isImmediate, isUnloading, retryCount)
    }
  }

  // 处理XHR上报：失败后触发重试
  private async handleXHR(
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    retryCount: number
  ): Promise<void> {
    const success = await reportByXHR(this.serverUrl, events)
    if (success) {
      this.log('XHR上报成功')
    } else {
      this.log('XHR上报失败，触发重试', 'warn')
      this.retryer.retry(this, events, isImmediate, isUnloading, retryCount)
    }
  }

  // 处理IMG上报：失败后触发重试
  private async handleIMG(
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    retryCount: number
  ): Promise<void> {
    const success = await reportByIMG(this.serverUrl, events)
    if (success) {
      this.log('IMG上报成功')
    } else {
      this.log('IMG上报失败，触发重试', 'warn')
      this.retryer.retry(this, events, isImmediate, isUnloading, retryCount)
    }
  }

  // 传输层日志打印
  private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (this.debug) {
      console[level](`[Transport] ${message}`)
    }
  }
}
