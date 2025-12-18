import { EventTypes } from '../../../common/index.js'
import { ApiMonitorOptions } from '../plugins/api-error.js'

export interface OpenTrackerConfig {
  apiKey: string
  serverUrl: string
}

export interface BaseEvent {
  event: string
  type: EventTypes
  timestamp: number
}

export interface TrackerConfig extends OpenTrackerConfig {
  batchLimit?: number // 批量队列阈值
  immediateMaxSize?: number // 立即队列最大容量
  batchMaxSize?: number // 批量队列最大容量
  debug?: boolean // 调试模式
  userId?: string // 初始用户ID
}

// 扩展基础事件：补充业务所需字段
export interface TrackEvent extends BaseEvent {
  data: Record<string, any> // 事件详情数据
  userId?: string // 关联用户ID
}

// 队列配置
export interface QueueConfig extends OpenTrackerConfig {
  batchLimit: number // 批量队列阈值
  immediateMaxSize: number // 立即队列最大容量
  batchMaxSize: number // 批量队列最大容量
  debug: boolean // 调试模式
}

// 本地存储配置项
export interface StorageConfig {
  enabled?: boolean // 是否启用本地存储
  maxSize?: number // 最大存储事件数
  maxAge?: number // 数据最大保存时间（ms）
}

// 重试配置项
export interface RetryConfig {
  maxTimes: number // 最大重试次数
  baseDelay: number // 基础延迟时间（ms），指数退避的基数
}

// 传输层配置：基于原有TrackerConfig扩展调试模式
export interface TransportConfig extends OpenTrackerConfig {
  debug?: boolean // 调试模式
}
