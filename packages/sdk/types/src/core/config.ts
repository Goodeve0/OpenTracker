import { EventTypes } from '../../../common/index.js'
import { ApiMonitorOptions } from '../plugins/api-error.js'

export interface OpenTrackerConfig {
  apiKey: string
  serverUrl: string
}

export interface BaseEvent {
  event: string
  type: string
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

// 生命周期钩子类型定义
export enum LifecycleHook {
  // 初始化相关钩子
  INIT = 'init', // 初始化完成后触发
  BEFORE_INIT = 'beforeInit', // 初始化前触发

  // 事件处理相关钩子
  BEFORE_COLLECT = 'beforeCollect', // 事件收集前触发
  AFTER_COLLECT = 'afterCollect', // 事件收集后触发
  BEFORE_REPORT = 'beforeReport', // 事件上报前触发
  AFTER_REPORT = 'afterReport', // 事件上报后触发

  // 销毁相关钩子
  BEFORE_DESTROY = 'beforeDestroy', //销毁前触发
  DESTROY = 'destroy', // 销毁后触发
}

// 生命周期上下文接口
export interface LifecycleContext {
  tracker: any // Tracker 实例引用
  config: any // SDK 配置
  event?: any // 当前事件数据（仅在事件相关钩子中存在）
  [key: string]: any // 其他上下文数据
}

// 生命周期钩子函数类型定义
export type LifecycleHookFunction = (
  context: LifecycleContext
) => boolean | void | Promise<boolean | void>

// 生命周期管理器配置接口
export interface LifecycleManagerConfig {
  enableHooks?: LifecycleHook[] // 启用的钩子列表
}
