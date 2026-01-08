// SDK插件类型定义
import { TrackEventMap } from '../../../types/src/core/event-bus.js'

/**
 * 插件状态枚举
 */
export enum PluginState {
  UNINITIALIZED = 'UNINITIALIZED', // 未初始化
  INITIALIZING = 'INITIALIZING', // 初始化中
  INITIALIZED = 'INITIALIZED', // 已初始化
  STARTED = 'STARTED', // 已启动
  STOPPED = 'STOPPED', // 已停止
  ERROR = 'ERROR', // 错误状态
}

/**
 * 插件上下文接口
 * 提供给插件的运行时上下文，支持扩展属性
 */
export interface PluginContext {
  tracker: any // Tracker实例
  config: any // 配置对象
  send: (
    eventType: string | any,
    eventData: Record<string, any>,
    isImmediate?: boolean
  ) => Promise<void> // 发送数据方法，与report方法签名一致
  // 事件发布/订阅方法
  on: <K extends keyof TrackEventMap>(
    eventName: K,
    handler: (data: TrackEventMap[K]) => void | Promise<void>,
    options?: { once?: boolean; priority?: number }
  ) => () => void
  once: <K extends keyof TrackEventMap>(
    eventName: K,
    handler: (data: TrackEventMap[K]) => void | Promise<void>,
    priority?: number
  ) => () => void
  emit: <K extends keyof TrackEventMap>(eventName: K, data: TrackEventMap[K]) => Promise<void>
  off: <K extends keyof TrackEventMap>(
    eventName: K,
    handler?: (data: TrackEventMap[K]) => void | Promise<void>
  ) => void
  [key: string]: any // 扩展属性
}

/**
 * 插件核心接口
 * 定义插件必须实现的方法和属性
 */
export interface IPlugin {
  // 插件基本信息
  name: string // 插件名称
  version: string // 插件版本
  description?: string // 插件描述
  author?: string // 作者信息
  dependencies?: string[] // 依赖的其他插件名称列表

  // 生命周期方法
  init: (context: PluginContext) => void | Promise<void> // 初始化插件（必需）
  start?: () => void | Promise<void> // 启动插件（可选）
  stop?: () => void | Promise<void> // 停止插件（可选）
  destroy?: () => void | Promise<void> // 销毁插件（可选）

  // 状态查询方法（可选）
  isInitialized?: () => boolean // 是否已初始化
  isStarted?: () => boolean // 是否已启动
}

/**
 * 插件构造函数类型
 */
export type PluginConstructor = new (...args: any[]) => IPlugin

/**
 * 插件配置选项接口
 * 支持灵活的插件配置方式
 */
export interface PluginOptions {
  plugin: IPlugin | PluginConstructor // 插件实例或构造函数
  autoInit?: boolean // 是否自动初始化，默认true
  autoStart?: boolean // 是否自动启动，默认true
  options?: Record<string, any> // 插件初始化选项
}

/**
 * 插件管理器接口
 * 定义插件管理器的核心方法
 */
export interface IPluginManager {
  // 设置插件上下文
  setContext(context: PluginContext): void

  // 注册插件
  register(options: PluginOptions): void
  registerAll(optionsList: PluginOptions[]): void

  // 插件生命周期管理
  initPlugin(name: string, options?: Record<string, any>): void
  startPlugin(name: string): void
  stopPlugin(name: string): void
  destroyPlugin(name: string): void
  destroyAll(): void

  // 获取插件
  getPlugin<T extends IPlugin>(name: string): T | undefined
  getAllPlugins(): IPlugin[]
  getInitializedPlugins(): IPlugin[]
  getStartedPlugins(): IPlugin[]

  // 依赖管理
  setDependencies(name: string, dependencies: string[]): void

  // 查询方法
  hasPlugin(name: string): boolean

  // 向后兼容方法
  registerPlugin(plugin: IPlugin): void
  registerPlugins(plugins: IPlugin[]): void
  loadPlugin(pluginName: string): boolean
  loadAllPlugins(): void
  stopAllPlugins(): void
  getRegisteredPlugins(): IPlugin[]
  getLoadedPlugins(): IPlugin[]
  getPluginInfo(pluginName: string): IPlugin | undefined
  isPluginRegistered(pluginName: string): boolean
  isPluginLoaded(pluginName: string): boolean
}

/**
 * 插件接口
 */
export interface Plugin {
  name: string
  version: string
  description?: string
  author?: string
  dependencies?: string[]
  init: (context: PluginContext) => void | Promise<void>
  start?: () => void | Promise<void>
  stop?: () => void | Promise<void>
  destroy?: () => void | Promise<void>
  [key: string]: any // 支持扩展属性
}
