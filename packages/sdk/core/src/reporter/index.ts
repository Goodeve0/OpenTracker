import { EventTypes } from '../../../common/index.js'
import { QueueManager } from './queue.js'
import { TrackerConfig, QueueConfig } from '../../../types/src/core/config.js'
import { WhiteScreenInfo } from '../../../types/src/plugins/white-screen.js'

export class Tracker {
  private static instance: Tracker
  private queueManager: QueueManager // 队列管理器实例
  private config: TrackerConfig

  private constructor(config: TrackerConfig) {
    if (!config.apiKey || !config.serverUrl) {
      throw new Error('apiKey和serverUrl为必填项')
    }

    // 合并配置并转换为队列配置
    const queueConfig: QueueConfig = {
      apiKey: config.apiKey,
      serverUrl: config.serverUrl,
      batchLimit: config.batchLimit || 20,
      immediateMaxSize: config.immediateMaxSize || 100,
      batchMaxSize: config.batchMaxSize || 1000,
      debug: config.debug || false,
    }

    this.config = config
    this.queueManager = new QueueManager(queueConfig)

    // 设置初始用户ID
    if (config.userId) {
      this.queueManager.setUserId(config.userId)
    }

    console.log('[Tracker] SDK初始化成功')
  }
  // 获取实例
  public static getInstance(config: TrackerConfig): Tracker {
    if (!Tracker.instance) {
      Tracker.instance = new Tracker(config)
    }
    return Tracker.instance
  }

  // 事件上报方法
  public report = (
    eventType: EventTypes | string,
    eventData: Record<string, any>,
    isImmediate = false
  ): void => {
    // 为不同类型的事件设置默认的立即上报策略
    const shouldImmediate =
      isImmediate ||
      eventType === EventTypes.ERROR ||
      (eventType === EventTypes.BEHAVIOR && eventData.eventName === 'pv')

    const event = this.queueManager.createBaseEvent(
      eventData.eventName || `${eventType}_event`,
      eventType as EventTypes,
      eventData
    )

    this.queueManager.enqueueEvent(event, shouldImmediate)
  }

  // 自定义事件上报方法
  public reportCustom = (
    eventName: string,
    eventType: EventTypes,
    data: Record<string, any>,
    isImmediate = false
  ): void => {
    const event = this.queueManager.createBaseEvent(eventName, eventType, data)
    this.queueManager.enqueueEvent(event, isImmediate)
  }

  // 核心业务事件手动上报方法
  public reportBusiness = (
    eventName: string,
    data: Record<string, any>,
    isImmediate = true
  ): void => {
    this.reportCustom(eventName, EventTypes.BUSINESS, data, isImmediate)
  }

  // 手动上报事件方法
  public trackEvent = (
    eventType: string,
    eventData?: Record<string, any>,
    isImmediate = false
  ): void => {
    this.reportCustom(eventType, EventTypes.BUSINESS, eventData || {}, isImmediate)
  }

  // 设置用户ID方法
  public setUserId = (userId: string): void => {
    this.queueManager.setUserId(userId)
    this.config.userId = userId
  }

  // 获取队列状态方法
  public getQueueStatus = (): { immediate: number; batch: number } => {
    return this.queueManager.getQueueStatus()
  }
}

export default Tracker

// 全局Tracker实例引用
let globalTrackerInstance: Tracker | null = null

// 初始化全局Tracker实例方法
export const initTracker = (config: TrackerConfig): Tracker => {
  globalTrackerInstance = Tracker.getInstance(config)
  return globalTrackerInstance
}

// 获取全局Tracker实例方法
export const getTracker = (): Tracker => {
  if (!globalTrackerInstance) {
    throw new Error('Tracker未初始化')
  }
  return globalTrackerInstance
}

// 性能数据自动上报方法
export const reportPerformance = (data: Record<string, number>): void => {
  const tracker = getTracker()
  tracker.report('performance', data)
}

// 行为数据自动上报方法
export const reportBehavior = (
  type: string,
  data: Record<string, any>,
  immediate = type === 'pv'
): void => {
  const tracker = getTracker()
  tracker.report('behavior', { ...data, eventName: `behavior_${type}` }, immediate)
}

// 错误数据自动上报方法
export const reportError = (error: Error | string, extra?: Record<string, any>): void => {
  const tracker = getTracker()
  const errorData = {
    message: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack || '' : '',
    ...extra,
  }
  tracker.report('error', errorData, true)
}

// 白屏错误自动上报方法
export const reportWhiteScreen = (data: WhiteScreenInfo): void => {
  const tracker = getTracker()
  tracker.report('white_screen', data, true)
}

// 全局手动事件上报便捷函数：直接调用单例实例的trackEvent方法
export const trackEvent = (
  eventType: string,
  eventData?: Record<string, any>,
  isImmediate = false
): void => {
  const tracker = getTracker()
  tracker.trackEvent(eventType, eventData, isImmediate)
}
