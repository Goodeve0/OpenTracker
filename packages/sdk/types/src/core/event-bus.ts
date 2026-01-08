import { ReportStrategy } from '../../../common/index.js'
import { TrackEvent } from './config.js'

// 埋点基础类型（所有埋点都包含的公共字段）
interface BaseTrackEvent {
  eventId: string // 埋点唯一标识
  timestamp: number // 触发时间戳
  pageId: string // 页面ID
  [key: string]: any // 扩展字段
}

// 点击埋点类型
export interface ClickTrackEvent extends BaseTrackEvent {
  type: 'click'
  elementId: string // 点击元素ID
  position: { x: number; y: number } // 点击位置
}

// 页面埋点类型
export interface PageTrackEvent extends BaseTrackEvent {
  type: 'page'
  pageName: string // 页面名称
  stayTime?: number // 停留时长
}

// 异常埋点类型
export interface ErrorTrackEvent extends BaseTrackEvent {
  type: 'error'
  errorMsg: string // 错误信息
  errorStack: string // 错误堆栈
}

// 所有埋点事件的类型映射（核心：约束事件名和对应类型）
export type TrackEventMap = {
  // 上报开始事件
  'tracker:report:start': {
    strategy: ReportStrategy
    eventCount: number
    isImmediate: boolean
    isUnloading: boolean
    retryCount: number
    serverUrl: string
  }
  'track:click': ClickTrackEvent
  'track:page': PageTrackEvent
  'track:error': ErrorTrackEvent
  // 上报成功事件
  'tracker:report:success': {
    strategy: ReportStrategy
    events: TrackEvent[]
    retryCount: number
    serverUrl: string
  }

  // 上报失败事件
  'tracker:report:fail': {
    strategy: ReportStrategy
    events: TrackEvent[]
    retryCount: number
    serverUrl: string
    reason: string
    error?: Error
  }
}

// 事件监听器类型（增加优先级）
export interface TrackListener<T = any> {
  handler: (data: T) => void | Promise<void>
  once: boolean // 是否只执行一次
  priority: number // 优先级（数值越高越先执行）
}
