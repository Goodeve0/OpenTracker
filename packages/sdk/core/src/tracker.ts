import { EventTypes } from '../../common/index.js'
import { QueueManager } from './reporter/queue.js'
import { TrackerConfig, QueueConfig } from '../../types/src/core/config.js'
import { WhiteScreenInfo } from '../../types/src/plugins/white-screen.js'
import {
  LifecycleHook,
  LifecycleContext,
  LifecycleHookFunction,
  LifecycleManagerConfig,
} from '../../types/src/core/config.js'
import { PluginManager } from './plugin/plugin-manager.js'
import { PluginContext } from './plugin/types.js'
export class LifecycleManager {
  private hooks: Map<LifecycleHook, LifecycleHookFunction[]> = new Map()
  private config: LifecycleManagerConfig

  constructor(config: LifecycleManagerConfig = {}) {
    this.config = {
      enableHooks: Object.values(LifecycleHook), // 默认启用所有钩子
      ...config,
    }
  }

  /**
   * 注册生命周期钩子
   * @param hook 钩子类型
   * @param fn 钩子函数
   */
  public register(hook: LifecycleHook, fn: LifecycleHookFunction): void {
    // 检查钩子是否启用
    if (!this.config.enableHooks?.includes(hook)) {
      return
    }

    if (!this.hooks.has(hook)) {
      this.hooks.set(hook, [])
    }

    this.hooks.get(hook)!.push(fn)
  }

  /**
   * 移除生命周期钩子
   * @param hook 钩子类型
   * @param fn 钩子函数（可选，不提供则移除所有该类型钩子）
   */
  public remove(hook: LifecycleHook, fn?: LifecycleHookFunction): void {
    if (!this.hooks.has(hook)) {
      return
    }

    if (fn) {
      const hookFns = this.hooks.get(hook)!
      const index = hookFns.indexOf(fn)
      if (index !== -1) {
        hookFns.splice(index, 1)
      }
    } else {
      this.hooks.delete(hook)
    }
  }

  /**
   * 触发生命周期钩子
   * @param hook 钩子类型
   * @param context 上下文数据
   * @returns 是否继续执行后续逻辑（如果有钩子返回false则停止）
   */
  public async trigger(hook: LifecycleHook, context: LifecycleContext): Promise<boolean> {
    // 检查钩子是否启用
    if (!this.config.enableHooks?.includes(hook)) {
      return true
    }

    const hookFns = this.hooks.get(hook)
    if (!hookFns || hookFns.length === 0) {
      return true
    }

    // 依次执行钩子函数
    for (const fn of hookFns) {
      try {
        const result = await fn(context)
        // 如果钩子返回false，则停止执行后续逻辑
        if (result === false) {
          return false
        }
      } catch (error) {
        console.error(`[LifecycleManager] 执行${hook}钩子时出错:`, error)
        // 钩子执行出错不影响后续钩子执行
      }
    }

    return true
  }

  /**
   * 获取当前注册的钩子数量
   * @param hook 钩子类型（可选，不提供则返回所有钩子数量）
   * @returns 钩子数量
   */
  public getHookCount(hook?: LifecycleHook): number {
    if (hook) {
      return this.hooks.get(hook)?.length || 0
    }

    return Array.from(this.hooks.values()).reduce((total, fns) => total + fns.length, 0)
  }

  /**
   * 清除所有钩子
   */
  public clear(): void {
    this.hooks.clear()
  }
}

export class Tracker {
  private static instance: Tracker | null
  private queueManager: QueueManager // 队列管理器实例
  private config: TrackerConfig
  private lifecycleManager: LifecycleManager // 生命周期管理器实例
  private pluginManager!: PluginManager

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
    this.lifecycleManager = new LifecycleManager()
    const pluginContext: PluginContext = {
      tracker: this,
      config: this.config,
      send: this.report.bind(this),
    }
    this.pluginManager = new PluginManager(pluginContext)
    console.log('🧩 Tracker插件系统已初始化')

    // 设置初始用户ID
    if (config.userId) {
      this.queueManager.setUserId(config.userId)
    }

    // 触发初始化完成钩子（使用void来忽略Promise，因为构造函数不能是async）
    void this.lifecycleManager.trigger(LifecycleHook.INIT, {
      tracker: this,
      config: this.config,
    })

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
  public report = async (
    eventType: EventTypes | string,
    eventData: Record<string, any>,
    isImmediate = false
  ): Promise<void> => {
    // 为不同类型的事件设置默认的立即上报策略
    const shouldImmediate =
      isImmediate ||
      eventType === EventTypes.ERROR ||
      (eventType === EventTypes.BEHAVIOR && eventData.eventName === 'pv')

    // 创建事件前上下文
    const context: LifecycleContext = {
      tracker: this,
      config: this.config,
      event: {
        eventType,
        eventData,
        isImmediate: shouldImmediate,
      },
    }

    // 触发事件收集前钩子
    const shouldContinue = await this.lifecycleManager.trigger(
      LifecycleHook.BEFORE_COLLECT,
      context
    )
    if (!shouldContinue) {
      return
    }

    // 创建事件
    const event = this.queueManager.createBaseEvent(
      eventData.eventName || `${eventType}_event`,
      eventType as EventTypes,
      context.event.eventData
    )

    // 更新上下文事件数据
    context.event = event

    // 触发事件收集后钩子
    await this.lifecycleManager.trigger(LifecycleHook.AFTER_COLLECT, context)

    // 触发事件上报前钩子
    const shouldReport = await this.lifecycleManager.trigger(LifecycleHook.BEFORE_REPORT, context)
    if (!shouldReport) {
      return
    }

    // 入队上报
    this.queueManager.enqueueEvent(event, shouldImmediate)

    // 触发事件上报后钩子
    await this.lifecycleManager.trigger(LifecycleHook.AFTER_REPORT, context)
  }

  // 自定义事件上报方法
  public reportCustom = async (
    eventName: string,
    eventType: EventTypes,
    data: Record<string, any>,
    isImmediate = false
  ): Promise<void> => {
    // 创建事件前上下文
    const context: LifecycleContext = {
      tracker: this,
      config: this.config,
      event: {
        eventType,
        eventData: data,
        isImmediate,
      },
    }

    // 触发事件收集前钩子
    const shouldContinue = await this.lifecycleManager.trigger(
      LifecycleHook.BEFORE_COLLECT,
      context
    )
    if (!shouldContinue) {
      return
    }

    // 创建事件
    const event = this.queueManager.createBaseEvent(eventName, eventType, context.event.eventData)
    context.event = event

    // 触发事件收集后钩子
    await this.lifecycleManager.trigger(LifecycleHook.AFTER_COLLECT, context)

    // 触发事件上报前钩子
    const shouldReport = await this.lifecycleManager.trigger(LifecycleHook.BEFORE_REPORT, context)
    if (!shouldReport) {
      return
    }

    // 入队上报
    this.queueManager.enqueueEvent(event, isImmediate)

    // 触发事件上报后钩子
    await this.lifecycleManager.trigger(LifecycleHook.AFTER_REPORT, context)
  }

  // 核心业务事件手动上报方法
  public reportBusiness = async (
    eventName: string,
    data: Record<string, any>,
    isImmediate = true
  ): Promise<void> => {
    await this.reportCustom(eventName, EventTypes.BUSINESS, data, isImmediate)
  }

  // 手动上报事件方法
  public trackEvent = async (
    eventType: string,
    eventData?: Record<string, any>,
    isImmediate = false
  ): Promise<void> => {
    await this.reportCustom(eventType, EventTypes.BUSINESS, eventData || {}, isImmediate)
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

  // 生命周期钩子注册方法
  public on = (hook: LifecycleHook, fn: LifecycleHookFunction): void => {
    this.lifecycleManager.register(hook, fn)
  }

  // 生命周期钩子移除方法
  public off = (hook: LifecycleHook, fn?: LifecycleHookFunction): void => {
    this.lifecycleManager.remove(hook, fn)
  }

  // 获取生命周期管理器实例
  public getLifecycleManager = (): LifecycleManager => {
    return this.lifecycleManager
  }

  // 获取配置
  public getConfig = (): TrackerConfig => {
    return this.config
  }

  // 插件管理方法
  public registerPlugin = (plugin: any): void => {
    this.pluginManager.registerPlugin(plugin)
  }

  public registerPlugins = (plugins: any[]): void => {
    this.pluginManager.registerPlugins(plugins)
  }

  public loadPlugin = (pluginName: string): boolean => {
    return this.pluginManager.loadPlugin(pluginName)
  }

  public loadAllPlugins = (): void => {
    this.pluginManager.loadAllPlugins()
  }

  public stopPlugin = (pluginName: string): boolean => {
    return this.pluginManager.stopPlugin(pluginName)
  }

  public stopAllPlugins = (): void => {
    this.pluginManager.stopAllPlugins()
  }

  public getPluginManager = (): PluginManager => {
    return this.pluginManager
  }

  // 清除实例（静态方法）
  public static clearInstance = (): void => {
    Tracker.instance = null
  }
}

// 销毁Tracker实例方法
export const destroyTracker = async (): Promise<void> => {
  if (!globalTrackerInstance) {
    return
  }

  // 创建销毁上下文
  const destroyContext: LifecycleContext = {
    tracker: globalTrackerInstance,
    config: { ...globalTrackerInstance.getConfig() },
  }

  // 触发销毁前钩子
  await globalTrackerInstance
    .getLifecycleManager()
    .trigger(LifecycleHook.BEFORE_DESTROY, destroyContext)

  // 触发销毁完成钩子
  await globalTrackerInstance.getLifecycleManager().trigger(LifecycleHook.DESTROY, destroyContext)

  // 清除全局实例
  globalTrackerInstance = null
  Tracker.clearInstance()

  console.log('[Tracker] SDK已销毁')
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
export const reportPerformance = async (data: Record<string, number>): Promise<void> => {
  const tracker = getTracker()
  await tracker.report('performance', data)
}

// 行为数据自动上报方法
export const reportBehavior = async (
  type: string,
  data: Record<string, any>,
  immediate = type === 'pv'
): Promise<void> => {
  const tracker = getTracker()
  await tracker.report('behavior', { ...data, eventName: `behavior_${type}` }, immediate)
}

// 错误数据自动上报方法
export const reportError = async (
  error: Error | string,
  extra?: Record<string, any>
): Promise<void> => {
  const tracker = getTracker()
  const errorData = {
    message: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack || '' : '',
    ...extra,
  }
  await tracker.report('error', errorData, true)
}

// 白屏错误自动上报方法
export const reportWhiteScreen = async (data: WhiteScreenInfo): Promise<void> => {
  const tracker = getTracker()
  await tracker.report('white_screen', data, true)
}

// 全局手动事件上报便捷函数：直接调用单例实例的trackEvent方法
export const trackEvent = async (
  eventType: string,
  eventData?: Record<string, any>,
  isImmediate = false
): Promise<void> => {
  const tracker = getTracker()
  await tracker.trackEvent(eventType, eventData, isImmediate)
}
