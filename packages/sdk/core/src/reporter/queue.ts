import { EventTypes } from '../../../common/index.js'
import { Transport } from './transport.js'
import { TrackEvent, QueueConfig } from '../../../types/src/core/config.js'

// 默认队列配置
const DEFAULT_QUEUE_CONFIG: Omit<QueueConfig, 'apiKey' | 'serverUrl'> = {
  batchLimit: 20,
  immediateMaxSize: 100,
  batchMaxSize: 1000,
  debug: false,
}

export class QueueManager {
  // 立即队列
  private immediateQueue: TrackEvent[] = []
  //批量队列
  private batchQueue: TrackEvent[] = []
  //队列配置
  private config: QueueConfig
  //用户ID
  private userId?: string
  //传输层实例
  private transport: Transport
  //页面卸载状态标记
  private isUnloading = false

  constructor(config: QueueConfig) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config }
    // 初始化传输层
    this.transport = new Transport({ serverUrl: this.config.serverUrl, apiKey: this.config.apiKey })
    // 监听页面卸载事件
    this.bindBeforeUnload()
    this.log('队列管理器初始化成功')
  }

  private isCriticalEvent(event: TrackEvent): boolean {
    const criticalEventNames = ['purchase', 'checkout', 'behavior_pv'] // 关键事件名称
    const criticalEventTypes = [EventTypes.ERROR] // 移除可能不存在的EventTypes.BUSINESS
    return criticalEventNames.includes(event.event) || criticalEventTypes.includes(event.type)
  }

  // 事件入队核心方法：动态分配到立即/批量队列
  public enqueueEvent(event: TrackEvent, isImmediate = false): void {
    try {
      // 补充用户ID
      if (this.userId && !event.userId) event.userId = this.userId

      if (isImmediate || this.isCriticalEvent(event)) {
        // 核心事件：加入立即队列并触发上报
        this.pushToImmediateQueue(event)
        this.log(`核心事件[${event.event}]入队立即队列，长度：${this.immediateQueue.length}`)
        this.flushImmediateQueue()
      } else {
        // 非核心事件：加入批量队列，达到阈值触发上报
        this.pushToBatchQueue(event)
        this.log(`非核心事件[${event.event}]入队批量队列，长度：${this.batchQueue.length}`)
        if (this.batchQueue.length >= this.config.batchLimit) {
          this.log(`批量队列达到阈值[${this.config.batchLimit}]，触发上报`)
          this.flushBatchQueue()
        }
      }
    } catch (error) {
      this.log(`事件入队失败：${(error as Error).message}`, 'error')
    }
  }

  // 推入立即队列：控制容量，满时移除最旧事件
  private pushToImmediateQueue(event: TrackEvent): void {
    if (this.immediateQueue.length >= this.config.immediateMaxSize) {
      this.immediateQueue.shift()
      this.log('立即队列已满，移除最旧事件', 'warn')
    }
    this.immediateQueue.push(event)
  }

  // 推入批量队列：控制容量，满时移除最旧事件
  private pushToBatchQueue(event: TrackEvent): void {
    if (this.batchQueue.length >= this.config.batchMaxSize) {
      this.batchQueue.shift()
      this.log('批量队列已满，移除最旧事件', 'warn')
    }
    this.batchQueue.push(event)
  }

  // 刷新立即队列：触发核心事件上报
  public flushImmediateQueue(): void {
    if (this.immediateQueue.length === 0) {
      this.log('立即队列为空，无需上报')
      return
    }
    const events = [...this.immediateQueue]
    this.immediateQueue = []
    // 调用传输层上报（标记为立即上报）
    this.transport.send(events, true, this.isUnloading, 0) // 传递所有必需参数
  }

  // 刷新批量队列：触发非核心事件批量上报
  public flushBatchQueue(): void {
    if (this.batchQueue.length === 0) {
      this.log('批量队列为空，无需上报')
      return
    }
    const events = [...this.batchQueue]
    this.batchQueue = []
    // 调用传输层上报（标记为批量上报）
    this.transport.send(events, false, this.isUnloading, 0) // 传递所有必需参数
  }

  // 监听页面卸载：标记状态并强制刷新所有队列
  private bindBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      this.isUnloading = true
      this.log('页面即将卸载，强制刷新所有队列')
      this.flushImmediateQueue()
      this.flushBatchQueue()
    })
  }

  // 创建基础事件，统一事件格式
  public createBaseEvent(
    eventName: string,
    eventType: EventTypes,
    data: Record<string, any>
  ): TrackEvent {
    const result: TrackEvent = {
      event: eventName,
      type: eventType,
      timestamp: Date.now(),
      data: {
        ...data,
        _apiKey: this.config.apiKey,
        _serverUrl: this.config.serverUrl,
        _trackTime: Date.now(),
      }, // 补充项目ID、服务器URL和追踪时间
    }
    if (this.userId) {
      result.userId = this.userId
    }
    return result
  }

  // 设置用户ID：同步到队列中
  public setUserId(userId: string): void {
    this.userId = userId
    this.log(`用户ID已更新：${userId}`)
  }

  // 获取队列状态
  public getQueueStatus(): { immediate: number; batch: number } {
    return {
      immediate: this.immediateQueue.length,
      batch: this.batchQueue.length,
    }
  }

  // 日志输出，根据debug模式控制
  private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (this.config.debug) {
      console[level](`[QueueManager] ${message}`)
    }
  }
}
