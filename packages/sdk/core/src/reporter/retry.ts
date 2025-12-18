import { TrackEvent, RetryConfig, StorageConfig } from '../../../types/src/core/config.js'
import { Transport } from './transport.js'

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxTimes: 3, // 最多重试3次
  baseDelay: 1000, // 基础延迟1秒
}

// 默认本地存储配置
const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  enabled: true, // 默认启用本地存储
  maxSize: 1000, // 最大存储1000条事件
  maxAge: 7 * 24 * 60 * 60 * 1000, // 最大保存7天
}

export class Retryer {
  private config: RetryConfig
  private storageConfig: StorageConfig
  private readonly STORAGE_KEY = 'opentracker_unsent_events'
  private networkStatus: boolean = navigator.onLine
  private readonly EVENT_ID_KEY = '_eventId'

  constructor(retryConfig?: Partial<RetryConfig>, storageConfig?: Partial<StorageConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
    this.storageConfig = { ...DEFAULT_STORAGE_CONFIG, ...storageConfig }

    // 监听网络状态变化
    this.bindNetworkEvent()

    // 初始化时检查本地存储并上报
    if (this.storageConfig.enabled) {
      this.loadAndReportStoredEvents()
    }
  }

  // 监听网络状态变化
  private bindNetworkEvent(): void {
    window.addEventListener('online', () => {
      this.networkStatus = true
      this.log('网络已恢复，检查本地存储的未上报事件')
      if (this.storageConfig.enabled) {
        this.loadAndReportStoredEvents()
      }
    })

    window.addEventListener('offline', () => {
      this.networkStatus = false
      this.log('网络已断开，启用本地存储兜底机制')
    })
  }

  // 生成唯一事件ID，用于去重
  private generateEventId(event: TrackEvent): string {
    return `${event.event}-${event.timestamp}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 为事件添加唯一ID
  private addEventId(events: TrackEvent[]): TrackEvent[] {
    return events.map((event) => {
      if (!event.data[this.EVENT_ID_KEY]) {
        event.data[this.EVENT_ID_KEY] = this.generateEventId(event)
      }
      return event
    })
  }

  // 保存事件到localStorage
  private saveEventsToStorage(events: TrackEvent[]): void {
    if (!this.storageConfig.enabled) {
      return
    }

    try {
      // 获取已有的未上报事件
      const existingEventsJson = localStorage.getItem(this.STORAGE_KEY)
      const existingEvents: TrackEvent[] = existingEventsJson ? JSON.parse(existingEventsJson) : []

      // 添加唯一ID
      const eventsWithId = this.addEventId(events)

      // 合并新事件
      const allEvents = [...existingEvents, ...eventsWithId]

      // 处理数据过期
      const now = Date.now()
      const validEvents = allEvents.filter((event) => {
        const eventAge = now - event.timestamp
        return eventAge <= this.storageConfig.maxAge!
      })

      // 处理存储容量（保留最新的事件）
      const maxEvents = this.storageConfig.maxSize!
      const eventsToStore = validEvents.slice(-maxEvents)

      // 去重（基于事件ID）
      const eventIdMap = new Map<string, TrackEvent>()
      eventsToStore.forEach((event) => {
        const eventId = event.data[this.EVENT_ID_KEY]
        if (eventId) {
          eventIdMap.set(eventId, event)
        }
      })

      const uniqueEvents = Array.from(eventIdMap.values())

      // 保存到localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(uniqueEvents))
      this.log(`${events.length}条事件已保存到localStorage，总计${uniqueEvents.length}条未上报事件`)
    } catch (error) {
      this.log(`保存事件到localStorage失败：${(error as Error).message}`, 'error')
    }
  }

  // 从localStorage加载并上报事件
  private loadAndReportStoredEvents(): void {
    if (!this.storageConfig.enabled) {
      return
    }

    try {
      const storedEventsJson = localStorage.getItem(this.STORAGE_KEY)
      if (!storedEventsJson) {
        this.log('localStorage中没有未上报的事件')
        return
      }

      const storedEvents: TrackEvent[] = JSON.parse(storedEventsJson)
      if (storedEvents.length === 0) {
        this.log('localStorage中没有未上报的事件')
        return
      }

      this.log(`从localStorage加载到${storedEvents.length}条未上报的事件`)

      // 清空localStorage，避免重复上报
      localStorage.removeItem(this.STORAGE_KEY)
      this.log('已清空localStorage中的未上报事件')

      // 重新上报事件
      // 确保storedEvents[0]存在
      if (storedEvents.length === 0) {
        return
      }

      // 使用非空断言或更安全的访问方式
      const firstEvent = storedEvents[0]! // 非空断言，因为已经检查了数组长度
      const serverUrl = (firstEvent.data && firstEvent.data._serverUrl) || ''
      const apiKey = (firstEvent.data && firstEvent.data._apiKey) || ''

      if (!serverUrl || !apiKey) {
        this.log('缺少服务器URL或API密钥，无法上报存储的事件', 'error')
        return
      }

      const transport = new Transport({
        serverUrl,
        apiKey,
        debug: true,
      })

      // 分批上报，每批最多50条
      const batchSize = 50
      for (let i = 0; i < storedEvents.length; i += batchSize) {
        const batch = storedEvents.slice(i, i + batchSize)
        transport.send(batch, false, false, 0)
      }
    } catch (error) {
      this.log(`从localStorage加载事件失败：${(error as Error).message}`, 'error')
    }
  }

  public retry(
    transport: Transport,
    events: TrackEvent[],
    isImmediate: boolean,
    isUnloading: boolean,
    currentCount = 0
  ): void {
    // 超过最大重试次数，保存到localStorage
    if (currentCount >= this.config.maxTimes) {
      this.log(`重试${this.config.maxTimes}次失败，将${events.length}条事件保存到localStorage`)
      this.saveEventsToStorage(events)
      return
    }

    // 计算指数退避延迟时间
    const delay = this.config.baseDelay * Math.pow(2, currentCount)
    this.log(`第${currentCount + 1}次重试，延迟${delay}ms`)

    // 延迟后重新调用传输层上报
    setTimeout(() => {
      transport.send(events, isImmediate, isUnloading, currentCount + 1)
    }, delay)
  }

  // 重试日志打印
  private log(message: string, level: 'log' | 'error' = 'log'): void {
    console[level](`[Retryer] ${message}`)
  }
}
