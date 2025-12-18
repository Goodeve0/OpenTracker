import { EventTypes } from '../../common/index.js'

// 配置接口
export interface OpenTrackerConfig {
  apiKey: string //项目id
  serverUrl: string //上报地址
}

//基础事件接口
export interface BaseEvent {
  event: string //事件名称
  type: EventTypes
  timestamp: number
}

export interface ReporterConfig {
  serverUrl: string
}
