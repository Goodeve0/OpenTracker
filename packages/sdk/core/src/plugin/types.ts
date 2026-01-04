// SDK内核插件类型定义

// 插件上下文接口
export interface PluginContext {
  tracker: any // Tracker实例
  config: any // 配置信息
  send: (eventType: string, eventData: Record<string, any>) => void // 事件发送方法
  [key: string]: any
}

// 插件接口
export interface Plugin {
  name: string // 插件名称
  version: string // 插件版本
  description?: string // 插件描述
  author?: string // 作者信息
  dependencies?: string[] // 依赖的其他插件
  init: (context: PluginContext) => void // 初始化方法
  start?: () => void // 启动方法
  stop?: () => void // 停止方法
  [key: string]: any
}
